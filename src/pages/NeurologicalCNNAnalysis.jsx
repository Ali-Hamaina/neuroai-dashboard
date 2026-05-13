import { useState, useEffect, useRef } from 'react'
import { Brain, AlertTriangle, Info, ToggleRight } from 'lucide-react'

// EEG channels with animated SVG waveforms
const EEG_CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4']

// Generate a random EEG-like SVG path
function generateEEGPath(seed) {
  let d = 'M0,50'
  for (let x = 0; x <= 500; x += 10) {
    const wave =
      20 * Math.sin((x + seed * 37) * 0.07) +
      8 * Math.sin((x + seed * 13) * 0.2) +
      3 * (Math.random() - 0.5)
    d += ` L${x},${50 + wave}`
  }
  return d
}

function EEGTrack({ label, seed, anomaly }) {
  const pathRef = useRef(null)

  // Animate the path on mount by shifting it
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    let offset = 0
    const interval = setInterval(() => {
      offset = (offset + 2) % 500
      path.style.strokeDashoffset = -offset
    }, 40)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center w-full border-b border-dashed border-outline-variant last:border-0 py-1">
      <span className="text-metric-unit font-grotesk text-on-surface-variant w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-10 relative overflow-hidden">
        <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
          <path
            ref={pathRef}
            d={generateEEGPath(seed)}
            fill="none"
            stroke={anomaly ? '#ffb690' : '#6bd8cb'}
            strokeWidth="1.5"
            strokeOpacity="0.7"
            strokeDasharray="500"
            strokeDashoffset="0"
          />
        </svg>
      </div>
    </div>
  )
}

export default function NeurologicalCNNAnalysis() {
  const [aiOverlay, setAiOverlay] = useState(true)

  return (
    <div className="p-margin bg-background min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

        {/* Left: EEG Monitor */}
        <section className="bg-surface-container rounded-lg border border-outline-variant flex flex-col p-md min-h-[420px]">
          <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
            <div>
              <h2 className="text-headline-md font-inter text-on-surface">Continuous EEG Monitor</h2>
              <span className="text-body-sm font-inter text-on-surface-variant">10-20 Standard Montage</span>
            </div>
            <div className="flex items-center gap-sm bg-surface-container-highest px-sm py-xs rounded border border-outline-variant">
              <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-label-caps font-grotesk text-primary">CNN Seizure Detection: Stable</span>
            </div>
          </header>

          {/* EEG Display */}
          <div className="flex-1 bg-surface-dim rounded border border-outline-variant relative overflow-hidden flex flex-col justify-between p-sm">
            {EEG_CHANNELS.map((ch, i) => (
              <EEGTrack key={ch} label={ch} seed={i + 1} anomaly={i === 2} />
            ))}

            {/* AI Marker */}
            <div className="absolute top-1/4 right-8 bg-surface-container-high border border-secondary px-xs py-0.5 rounded text-secondary text-label-caps text-[10px] font-grotesk flex items-center gap-0.5 shadow">
              <Info size={10} />
              Minor Artifact
            </div>
          </div>
        </section>

        {/* Right: CT Scan */}
        <section className="bg-surface-container rounded-lg border border-outline-variant flex flex-col p-md min-h-[420px]">
          <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
            <div>
              <h2 className="text-headline-md font-inter text-on-surface">CT Scan (TDM cérébrale)</h2>
              <span className="text-body-sm font-inter text-on-surface-variant">Axial View - Non-Contrast</span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="text-label-caps font-grotesk text-on-surface-variant">AI Overlay</span>
              <button
                onClick={() => setAiOverlay(v => !v)}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  aiOverlay ? 'bg-primary-container' : 'bg-surface-variant'
                }`}
              >
                <div className={`w-4 h-4 bg-on-primary-container rounded-full absolute top-0.5 transition-transform ${
                  aiOverlay ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </header>

          {/* CT Viewer Placeholder */}
          <div className="flex-1 bg-surface-dim rounded border border-outline-variant flex items-center justify-center relative overflow-hidden">
            {/* Brain silhouette circles */}
            <div className="w-56 h-56 bg-surface-variant rounded-full border-2 border-outline-variant opacity-20 absolute" />
            <div className="w-40 h-44 bg-surface-container-high rounded-full border border-outline-variant opacity-15 absolute" />
            {/* Gyri lines */}
            <svg className="absolute w-56 h-56 opacity-10" viewBox="0 0 200 200">
              <path d="M60,100 Q80,70 100,100 Q120,130 140,100" stroke="#6bd8cb" strokeWidth="2" fill="none" />
              <path d="M50,120 Q75,90 100,120 Q125,150 150,120" stroke="#6bd8cb" strokeWidth="2" fill="none" />
              <path d="M70,80 Q90,55 110,80 Q130,105 150,80" stroke="#6bd8cb" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-body-lg font-inter text-on-surface-variant opacity-40 select-none">CT Image Viewer</span>

            {/* AI Heatmap Overlay */}
            {aiOverlay && (
              <>
                <div className="absolute top-1/3 left-[38%] w-20 h-20 bg-error rounded-full blur-2xl opacity-25 mix-blend-screen" />
                <div className="absolute top-[38%] left-[36%] bg-error-container border border-error px-xs py-0.5 rounded text-error text-label-caps text-[10px] font-grotesk flex items-center gap-0.5 shadow">
                  <AlertTriangle size={10} />
                  Edema Suspected
                </div>
              </>
            )}
          </div>

          <div className="mt-sm flex justify-between text-on-surface-variant text-metric-unit font-grotesk">
            <span>Slice: 45/120</span>
            <span>Thickness: 5mm</span>
          </div>
        </section>

        {/* Bottom: Automated Neuro-Summary */}
        <section className="lg:col-span-2 bg-surface-container rounded-lg border border-outline-variant p-md">
          <header className="flex items-center gap-sm mb-sm">
            <Brain size={20} className="text-secondary" />
            <h3 className="text-headline-md font-inter text-on-surface">Automated Neuro-Summary</h3>
            <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded text-label-caps text-[10px] font-grotesk ml-auto">
              AI Generated
            </span>
          </header>
          <div className="bg-surface-dim p-sm rounded border border-outline-variant">
            <p className="text-body-lg font-inter text-on-surface leading-relaxed">
              Continuous EEG indicates stable background rhythms with no epileptiform discharges detected in the
              last 4 hours. CT imaging analysis highlights a localized region of reduced density in the left
              parietal lobe, consistent with mild vasogenic edema. Combined analysis suggests a low immediate
              risk for seizure activity, but neurological observation should be maintained for potential
              localized pressure increases.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
