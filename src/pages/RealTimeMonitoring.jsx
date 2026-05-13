import { useEffect, useRef, useState, useCallback } from 'react'
import { AlertTriangle, Activity, Brain, Wind, Heart, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── Gaussian noise ──────────────────────────────────────────────────────────
function gauss(std) {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// ─── ECG morphology (0..1 phase) ─────────────────────────────────────────────
function ecgY(p) {
  if (p < 0.10) return 0.10 * Math.sin(Math.PI * p / 0.10)
  if (p < 0.15) return 0
  if (p < 0.18) return -0.20 * ((p - 0.15) / 0.03)
  if (p < 0.22) return  1.20 * ((p - 0.18) / 0.04)
  if (p < 0.28) return  1.20 * (1 - (p - 0.22) / 0.06)
  if (p < 0.32) return -0.15 * ((p - 0.28) / 0.04)
  if (p < 0.36) return -0.15 * (1 - (p - 0.32) / 0.04)
  if (p < 0.45) return 0.05
  if (p < 0.70) return 0.25 * Math.sin(Math.PI * (p - 0.45) / 0.25)
  return 0
}

// ─── EEG alpha wave ───────────────────────────────────────────────────────────
function eegY(p) {
  return 0.40 * Math.sin(2 * Math.PI * 9 * p)
    + 0.15 * Math.sin(2 * Math.PI * 20 * p)
    + 0.05 * (Math.random() - 0.5)
}

// ─── Respiration wave ─────────────────────────────────────────────────────────
function respY(p) {
  return 0.6 * Math.sin(2 * Math.PI * p) + (Math.random() - 0.5) * 0.08
}

// ─── Canvas Waveform component ────────────────────────────────────────────────
function WaveCanvas({ buffer, color, min = -0.3, max = 1.3, glowColor }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const range = max - min
    ctx.shadowBlur = 10
    ctx.shadowColor = glowColor || color
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    buffer.forEach((v, i) => {
      const x = (i / (buffer.length - 1)) * W
      const y = H - ((v - min) / range) * H
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [buffer, color, min, max, glowColor])
  return <canvas ref={ref} width={400} height={80} className="w-full h-full" />
}

// ─── Mini sparkline (trend history) ──────────────────────────────────────────
function Sparkline({ data, color, height = 40 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const vals = data.map(d => d.v ?? d.sbp)
    const lo = Math.min(...vals) - 2
    const hi = Math.max(...vals) + 2
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 6
    ctx.shadowColor = color
    ctx.beginPath()
    vals.forEach((v, i) => {
      const x = (i / (vals.length - 1)) * W
      const y = H - ((v - lo) / (hi - lo)) * H
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color])
  return <canvas ref={ref} width={200} height={height} className="w-full" style={{ height }} />
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
function useVitals() {
  const N = 200
  const ecgPhase = useRef(0)
  const eegPhase = useRef(0)
  const respPhase = useRef(0)
  const tick = useRef(0)

  const init = useCallback(() => ({
    hr: 102, spo2: 91.0, sbp: 138, dbp: 88, rr: 22,
    ecg: Array.from({ length: N }, (_, i) => ecgY(i / N)),
    eeg: Array.from({ length: N }, (_, i) => eegY(i / N)),
    resp: Array.from({ length: N }, (_, i) => respY(i / N)),
    hrHist:   Array.from({ length: 30 }, () => ({ v: 100 + gauss(3) })),
    spo2Hist: Array.from({ length: 30 }, () => ({ v: 91  + gauss(1) })),
    bpHist:   Array.from({ length: 30 }, () => ({ sbp: 136 + gauss(4), dbp: 86 + gauss(3) })),
    rrHist:   Array.from({ length: 30 }, () => ({ v: 21 + gauss(1.5) })),
  }), [])

  const [state, setState] = useState(init)

  useEffect(() => {
    const id = setInterval(() => {
      ecgPhase.current  = (ecgPhase.current  + 0.007) % 1
      eegPhase.current  = (eegPhase.current  + 0.005) % 1
      respPhase.current = (respPhase.current + 0.0025) % 1
      tick.current += 1
      const slowTick = tick.current % 30 === 0

      setState(prev => {
        const newEcg  = [...prev.ecg.slice(1),  ecgY(ecgPhase.current)  + gauss(0.015)]
        const newEeg  = [...prev.eeg.slice(1),  eegY(eegPhase.current)]
        const newResp = [...prev.resp.slice(1), respY(respPhase.current)]

        if (!slowTick) return { ...prev, ecg: newEcg, eeg: newEeg, resp: newResp }

        const hr   = clamp(prev.hr   + gauss(1.5), 55,  160)
        const spo2 = clamp(prev.spo2 + gauss(0.4), 82,  100)
        const sbp  = clamp(prev.sbp  + gauss(2),   90,  200)
        const dbp  = clamp(prev.dbp  + gauss(1.5), 50,  130)
        const rr   = clamp(prev.rr   + gauss(0.5),  8,   40)

        return {
          hr: Math.round(hr), spo2: +spo2.toFixed(1),
          sbp: Math.round(sbp), dbp: Math.round(dbp), rr: Math.round(rr),
          ecg: newEcg, eeg: newEeg, resp: newResp,
          hrHist:   [...prev.hrHist.slice(-29),   { v: hr }],
          spo2Hist: [...prev.spo2Hist.slice(-29), { v: spo2 }],
          bpHist:   [...prev.bpHist.slice(-29),   { sbp, dbp }],
          rrHist:   [...prev.rrHist.slice(-29),   { v: rr }],
        }
      })
    }, 33)
    return () => clearInterval(id)
  }, [])

  return state
}

// ─── Vital Card ───────────────────────────────────────────────────────────────
function VitalCard({ label, value, unit, color, textColor, isCritical, sparkData, sparkKey = 'v', icon: Icon, children }) {
  const borderClass = isCritical ? 'border-red-500' : 'border-white/10'
  const glowClass   = isCritical ? 'shadow-[0_0_20px_rgba(239,68,68,0.25)]' : ''
  return (
    <div className={`bg-[#0e1a24] border ${borderClass} ${glowClass} rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden`}>
      {isCritical && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} color={color} />}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        {isCritical && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold font-mono" style={{ color: textColor || color }}>{value}</span>
        <span className="text-sm text-slate-500 mb-1">{unit}</span>
      </div>
      {children}
      {sparkData && (
        <Sparkline data={sparkData.map(d => ({ v: d[sparkKey] }))} color={color} height={32} />
      )}
    </div>
  )
}

// ─── Waveform Panel ───────────────────────────────────────────────────────────
function WavePanel({ label, buffer, color, min, max, badge, icon: Icon }) {
  return (
    <div className="bg-[#061018] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} color={color} />}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <div className="h-20 w-full bg-black/40 rounded-lg overflow-hidden border border-white/5">
        <WaveCanvas buffer={buffer} color={color} min={min} max={max} glowColor={color} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RealTimeMonitoring() {
  const v = useVitals()

  const hrCrit   = v.hr > 120 || v.hr < 50
  const spo2Crit = v.spo2 < 92
  const rrCrit   = v.rr > 30 || v.rr < 10
  const bpCrit   = v.sbp > 160 || v.sbp < 90

  return (
    <div className="p-4 bg-[#080f18] min-h-screen flex flex-col gap-4">

      {/* ── Patient Banner ── */}
      <div className="bg-[#0e1a24] border border-white/10 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-cyan-800 flex items-center justify-center text-white font-bold">DJ</div>
          <div>
            <h2 className="text-white font-semibold text-lg">DOE, JANE — Bed 04</h2>
            <p className="text-slate-400 text-xs">Age: 64 · F · MRN: 8849-21A · Subarachnoid Hemorrhage</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">GCS</p>
            <p className="text-2xl font-bold text-teal-400 font-mono">8<span className="text-slate-500 text-sm">/15</span></p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/50 border border-red-700/40">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-300 text-xs font-semibold">CRITICAL — Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* ── Vital Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

        {/* HR */}
        <VitalCard label="Fréq. Cardiaque" value={v.hr} unit="bpm"
          color="#6bd8cb" isCritical={hrCrit} icon={Heart} sparkData={v.hrHist} sparkKey="v">
          <span className={`text-[10px] font-semibold ${hrCrit ? 'text-red-400' : 'text-teal-400'}`}>
            {hrCrit ? '⚠ Tachycardie' : '✓ Normal'}
          </span>
        </VitalCard>

        {/* SpO2 */}
        <VitalCard label="Saturation O₂" value={`${v.spo2}`} unit="%"
          color={spo2Crit ? '#f87171' : '#34d399'} textColor={spo2Crit ? '#f87171' : '#34d399'}
          isCritical={spo2Crit} icon={Droplets} sparkData={v.spo2Hist} sparkKey="v">
          <span className={`text-[10px] font-semibold ${spo2Crit ? 'text-red-400' : 'text-emerald-400'}`}>
            {spo2Crit ? '⚠ Hypoxémie' : '✓ Acceptable'}
          </span>
        </VitalCard>

        {/* BP systolic */}
        <VitalCard label="Tension Artérielle" value={`${v.sbp}/${v.dbp}`} unit="mmHg"
          color={bpCrit ? '#fb923c' : '#a78bfa'} isCritical={bpCrit} icon={Activity}
          sparkData={v.bpHist} sparkKey="sbp">
          <span className={`text-[10px] font-semibold ${bpCrit ? 'text-orange-400' : 'text-purple-400'}`}>
            {bpCrit ? '⚠ Hypertension' : '✓ Stable'}
          </span>
        </VitalCard>

        {/* RR */}
        <VitalCard label="Fréq. Respiratoire" value={v.rr} unit="rpm"
          color={rrCrit ? '#f87171' : '#60a5fa'} isCritical={rrCrit} icon={Wind} sparkData={v.rrHist} sparkKey="v">
          <span className={`text-[10px] font-semibold ${rrCrit ? 'text-red-400' : 'text-blue-400'}`}>
            {rrCrit ? '⚠ Tachypnée' : '✓ Normal'}
          </span>
        </VitalCard>

        {/* Temp placeholder */}
        <VitalCard label="Température" value="38.4" unit="°C" color="#f59e0b" icon={TrendingUp}>
          <span className="text-[10px] font-semibold text-amber-400">⚠ Fièvre légère</span>
        </VitalCard>

        {/* ICP */}
        <VitalCard label="Pression Crânienne" value="18" unit="mmHg" color="#c084fc" icon={Brain}>
          <span className="text-[10px] font-semibold text-purple-400">✓ Limite haute</span>
        </VitalCard>
      </div>

      {/* ── Waveforms ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <WavePanel label="ECG — Dérivation II" buffer={v.ecg} color="#6bd8cb"
          min={-0.4} max={1.4} badge="LIVE" icon={Heart} />
        <WavePanel label="EEG — Onde Alpha" buffer={v.eeg} color="#a78bfa"
          min={-0.8} max={0.8} badge="LIVE" icon={Brain} />
        <WavePanel label="Respiration (capnographie)" buffer={v.resp} color="#60a5fa"
          min={-0.9} max={0.9} badge="LIVE" icon={Wind} />
      </div>

      {/* ── LSTM Warning + BP trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* LSTM */}
        <div className="lg:col-span-1 bg-[#0e1a24] border border-orange-500/40 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Brain size={16} className="text-orange-400" /> LSTM — Alerte Précoce
            </h3>
            <span className="text-[10px] bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded-full animate-pulse font-bold">IA ACTIVE</span>
          </div>
          <div className="bg-orange-950/30 border border-orange-700/30 rounded-lg p-3 text-center">
            <p className="text-5xl font-bold font-mono text-orange-400">78%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Risque Insuffisance Respiratoire</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Prédiction dans les 4 heures</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Trajectoire SpO₂', val: '-3% / h', icon: TrendingDown, color: 'text-red-400' },
              { label: 'Travail Respiratoire', val: 'Élevé', icon: TrendingUp, color: 'text-orange-400' },
              { label: 'Pression Artérielle', val: 'Stable', icon: Minus, color: 'text-blue-400' },
            ].map(({ label, val, icon: I, color }) => (
              <div key={label} className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <I size={14} className={color} />
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
                <span className={`text-xs font-bold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BP history as canvas sparkline */}
        <div className="lg:col-span-2 bg-[#0e1a24] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={16} className="text-purple-400" /> Historique Tension Artérielle (30 dernières mesures)
          </h3>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400 inline-block" /> Systolique</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Diastolique</span>
          </div>
          <div className="flex-1 bg-black/30 rounded-lg overflow-hidden border border-white/5 min-h-[120px] relative">
            <BPCanvas bpHistory={v.bpHist} />
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── BP Dual-line Canvas ──────────────────────────────────────────────────────
function BPCanvas({ bpHistory }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !bpHistory.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const allVals = bpHistory.flatMap(d => [d.sbp, d.dbp])
    const lo = Math.min(...allVals) - 5
    const hi = Math.max(...allVals) + 5
    const toY = v => H - ((v - lo) / (hi - lo)) * H

    const drawLine = (key, color) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.shadowBlur = 8
      ctx.shadowColor = color
      ctx.beginPath()
      bpHistory.forEach((d, i) => {
        const x = (i / (bpHistory.length - 1)) * W
        const y = toY(d[key])
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    drawLine('sbp', '#a78bfa')
    drawLine('dbp', '#60a5fa')
  }, [bpHistory])

  return <canvas ref={ref} width={800} height={120} className="w-full h-full" />
}
