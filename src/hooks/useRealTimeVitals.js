import { useState, useEffect, useRef, useCallback } from 'react'

// Clamp helper
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

// Gaussian noise generator
function gaussianNoise(mean, std) {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// Generate a realistic ECG sample for a given time offset (0..1 = one beat)
export function ecgSample(phase) {
  // P wave
  if (phase < 0.1) return 0.1 * Math.sin(Math.PI * phase / 0.1)
  // PQ segment
  if (phase < 0.15) return 0
  // QRS complex
  if (phase < 0.18) return -0.2 * ((phase - 0.15) / 0.03)
  if (phase < 0.22) return 1.2 * ((phase - 0.18) / 0.04)
  if (phase < 0.28) return 1.2 * (1 - (phase - 0.22) / 0.06)
  if (phase < 0.32) return -0.15 * ((phase - 0.28) / 0.04)
  if (phase < 0.36) return -0.15 * (1 - (phase - 0.32) / 0.04)
  // ST segment
  if (phase < 0.45) return 0.05
  // T wave
  if (phase < 0.7) return 0.25 * Math.sin(Math.PI * (phase - 0.45) / 0.25)
  return 0
}

// EEG alpha wave (8-13 Hz simulation compressed to display)
export function eegSample(phase, amplitude = 0.4) {
  return amplitude * Math.sin(2 * Math.PI * 9 * phase)
    + 0.15 * Math.sin(2 * Math.PI * 20 * phase)
    + 0.05 * (Math.random() - 0.5)
}

const WAVEFORM_POINTS = 120

function buildECGBuffer() {
  const buf = []
  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phase = (i / WAVEFORM_POINTS) % 1
    buf.push(ecgSample(phase) + (Math.random() - 0.5) * 0.02)
  }
  return buf
}

function buildEEGBuffer() {
  const buf = []
  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    buf.push(eegSample(i / WAVEFORM_POINTS))
  }
  return buf
}

function buildRespBuffer() {
  const buf = []
  for (let i = 0; i < WAVEFORM_POINTS; i++) {
    const phase = i / WAVEFORM_POINTS
    buf.push(0.6 * Math.sin(2 * Math.PI * phase) + (Math.random() - 0.5) * 0.08)
  }
  return buf
}

export function useRealTimeVitals() {
  const [vitals, setVitals] = useState({
    hr: 102,
    spo2: 91,
    sbp: 138,
    dbp: 88,
    rr: 22,
    ecgBuffer: buildECGBuffer(),
    eegBuffer: buildEEGBuffer(),
    respBuffer: buildRespBuffer(),
    hrHistory: Array.from({ length: 30 }, (_, i) => ({ t: i, v: 98 + gaussianNoise(0, 3) })),
    bpHistory: Array.from({ length: 30 }, (_, i) => ({ t: i, sbp: 135 + gaussianNoise(0, 4), dbp: 86 + gaussianNoise(0, 3) })),
    spo2History: Array.from({ length: 30 }, (_, i) => ({ t: i, v: 92 + gaussianNoise(0, 1.5) })),
    rrHistory: Array.from({ length: 30 }, (_, i) => ({ t: i, v: 21 + gaussianNoise(0, 1.5) })),
  })

  const phaseRef = useRef(0)
  const eegPhaseRef = useRef(0)
  const respPhaseRef = useRef(0)
  const tickRef = useRef(0)

  const tick = useCallback(() => {
    phaseRef.current = (phaseRef.current + 0.008) % 1
    eegPhaseRef.current = (eegPhaseRef.current + 0.006) % 1
    respPhaseRef.current = (respPhaseRef.current + 0.003) % 1
    tickRef.current += 1

    setVitals(prev => {
      // Scroll waveform buffers left by 1 and push new sample
      const newECG = [...prev.ecgBuffer.slice(1), ecgSample(phaseRef.current) + (Math.random() - 0.5) * 0.02]
      const newEEG = [...prev.eegBuffer.slice(1), eegSample(eegPhaseRef.current)]
      const newResp = [...prev.respBuffer.slice(1),
        0.6 * Math.sin(2 * Math.PI * respPhaseRef.current) + (Math.random() - 0.5) * 0.08]

      // Slowly drift vitals every 30 ticks (~1s)
      if (tickRef.current % 30 !== 0) {
        return { ...prev, ecgBuffer: newECG, eegBuffer: newEEG, respBuffer: newResp }
      }

      const hr = clamp(prev.hr + gaussianNoise(0, 1.5), 55, 160)
      const spo2 = clamp(prev.spo2 + gaussianNoise(0, 0.5), 82, 100)
      const sbp = clamp(prev.sbp + gaussianNoise(0, 2), 90, 200)
      const dbp = clamp(prev.dbp + gaussianNoise(0, 1.5), 50, 130)
      const rr = clamp(prev.rr + gaussianNoise(0, 0.6), 8, 40)
      const t = prev.hrHistory.length

      return {
        hr: Math.round(hr),
        spo2: parseFloat(spo2.toFixed(1)),
        sbp: Math.round(sbp),
        dbp: Math.round(dbp),
        rr: Math.round(rr),
        ecgBuffer: newECG,
        eegBuffer: newEEG,
        respBuffer: newResp,
        hrHistory: [...prev.hrHistory.slice(-29), { t, v: hr }],
        bpHistory: [...prev.bpHistory.slice(-29), { t, sbp, dbp }],
        spo2History: [...prev.spo2History.slice(-29), { t, v: spo2 }],
        rrHistory: [...prev.rrHistory.slice(-29), { t, v: rr }],
      }
    })
  }, [])

  useEffect(() => {
    const id = setInterval(tick, 33) // ~30 fps
    return () => clearInterval(id)
  }, [tick])

  return vitals
}
