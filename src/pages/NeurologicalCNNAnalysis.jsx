import { useState, useEffect, useRef } from 'react'
import { Brain, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, ArrowRight, CheckSquare, Square, Activity } from 'lucide-react'

// EEG channels with animated SVG waveforms
const EEG_CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4']

// Generate a random EEG-like SVG path
function generateEEGPath(seed, anomaly) {
  let d = 'M0,50'
  const amplitudeMultiplier = anomaly ? 2.5 : 1;
  const frequencyMultiplier = anomaly ? 2 : 1;
  
  for (let x = 0; x <= 500; x += 10) {
    const wave =
      (20 * Math.sin((x + seed * 37) * 0.07 * frequencyMultiplier) +
      8 * Math.sin((x + seed * 13) * 0.2 * frequencyMultiplier)) * amplitudeMultiplier +
      (anomaly ? 15 * (Math.random() - 0.5) : 3 * (Math.random() - 0.5))
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
            d={generateEEGPath(seed, anomaly)}
            fill="none"
            stroke={anomaly ? '#ffb690' : '#6bd8cb'}
            strokeWidth={anomaly ? "2" : "1.5"}
            strokeOpacity="0.7"
            strokeDasharray="500"
            strokeDashoffset="0"
          />
        </svg>
      </div>
    </div>
  )
}

function Sparkline({ data, color }) {
  const min = Math.min(...data) * 0.8;
  const max = Math.max(...data) * 1.2;
  const range = max - min || 1;
  
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="-5 -5 110 110" className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChipToggle({ label, active, onChange }) {
  return (
    <button onClick={onChange} className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${active ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-surface border-outline-variant text-on-surface-variant hover:text-on-surface'}`}>
      {label}
    </button>
  );
}

function ChipSelect({ label, options, value, onChange }) {
  return (
    <div className="flex items-center border border-outline-variant rounded overflow-hidden">
      <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-xs border-r border-outline-variant">{label}</span>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} className={`px-2 py-1 text-xs transition-colors ${value === opt ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-variant'}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function MetricCard({ title, value, trend, sparkline, tooltip }) {
  return (
    <div className="bg-surface-dim rounded border border-outline-variant p-sm flex flex-col justify-between group relative h-24">
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-48 bg-surface-container-high border border-outline-variant text-on-surface p-1.5 rounded text-[10px] shadow-lg z-10">
        {tooltip}
      </div>

      <div className="text-label-caps text-on-surface-variant font-grotesk flex justify-between items-center mb-1">
        {title}
        <Info size={12} className="opacity-50" />
      </div>
      <div className="flex items-end justify-between flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-headline-md font-inter text-on-surface">{value}</span>
          <span className={`flex items-center text-xs ${trend === 'up' ? 'text-error' : trend === 'down' ? 'text-primary' : 'text-on-surface-variant'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowRight size={14} />}
          </span>
        </div>
        <div className="w-12 h-6 opacity-70">
          {sparkline}
        </div>
      </div>
    </div>
  );
}

export default function NeurologicalCNNAnalysis() {
  const [overlayMode, setOverlayMode] = useState('heatmap') // 'off' | 'heatmap' | 'contours'
  
  // Simulation Inputs
  const [inputs, setInputs] = useState({
    sedation: 'None', // 'None' | 'Light' | 'Deep'
    pupils: 'Normal', // 'Normal' | 'Anisocoria'
    fever: 'No', // 'Yes' | 'No'
    triggerSeizure: false,
    triggerArtifact: false
  });
  
  const [ctInputs, setCtInputs] = useState({
    edema: true,
    midlineShift: false,
    hemorrhage: false,
  });

  // History State
  const [history, setHistory] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      time: i,
      seizureProb: 12 + Math.random() * 5,
      artifactIndex: 15 + Math.random() * 8
    }))
  });
  
  const [ackedRecs, setAckedRecs] = useState({});

  // Real-time Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(curr => {
        const last = curr[curr.length - 1];
        
        let nextSeizure = last.seizureProb + (Math.random() - 0.5) * 6;
        if (inputs.triggerSeizure) {
          nextSeizure += 15; // Spike up quickly
        } else if (inputs.sedation === 'Deep') {
          nextSeizure -= 2; // Drift down
        } else if (nextSeizure > 25) {
          nextSeizure -= 1; // Natural decay
        }
        nextSeizure = Math.max(0, Math.min(100, nextSeizure));
        
        let nextArtifact = last.artifactIndex + (Math.random() - 0.5) * 6;
        if (inputs.triggerArtifact) {
          nextArtifact += 15; // Spike up quickly
        } else if (nextArtifact > 20) {
          nextArtifact -= 1.5; // Natural decay
        }
        nextArtifact = Math.max(0, Math.min(100, nextArtifact));
        
        return [...curr.slice(1), {
          time: last.time + 1,
          seizureProb: nextSeizure,
          artifactIndex: nextArtifact
        }];
      });
    }, 2000); // Faster updates for visibility
    return () => clearInterval(interval);
  }, [inputs.sedation, inputs.triggerSeizure, inputs.triggerArtifact]);

  // Derived Metrics
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];

  const seizureTrend = latest.seizureProb > prev.seizureProb + 1 ? 'up' : latest.seizureProb < prev.seizureProb - 1 ? 'down' : 'stable';
  const artifactTrend = latest.artifactIndex > prev.artifactIndex + 1 ? 'up' : latest.artifactIndex < prev.artifactIndex - 1 ? 'down' : 'stable';

  let eegBackground = 'Normal';
  let eegRationale = 'Rhythms within expected frequency bands';
  if (inputs.sedation === 'Deep') {
    eegBackground = 'Suppression';
    eegRationale = 'Voltage suppression consistent with deep sedation';
  } else if (inputs.sedation === 'Light' || inputs.fever === 'Yes') {
    eegBackground = 'Slowing';
    eegRationale = 'Diffuse slowing observed';
  }

  let ctRisk = 0;
  if (ctInputs.edema) ctRisk += 3;
  if (ctInputs.midlineShift) ctRisk += 4;
  if (ctInputs.hemorrhage) ctRisk += 3;

  let icpRisk = 'Low';
  if (ctRisk >= 7 || (ctRisk >= 4 && inputs.pupils === 'Anisocoria')) {
    icpRisk = 'High';
  } else if (ctRisk >= 4) {
    icpRisk = 'Moderate';
  }

  // Alerts
  const alerts = [];
  if (icpRisk === 'High' || (ctInputs.edema && ctInputs.midlineShift)) {
    alerts.push({ id: 1, type: 'Critical', text: 'Possible raised ICP', icon: <AlertTriangle size={14}/> });
  }
  if (latest.seizureProb > 30) {
    alerts.push({ id: 2, type: 'Warning', text: 'Possible non-convulsive seizure risk', icon: <Activity size={14}/> });
  }
  if (latest.artifactIndex > 40) {
    alerts.push({ id: 3, type: 'Info', text: 'Signal quality degraded', icon: <Info size={14}/> });
  }

  // Recommendations
  const recs = [];
  if (icpRisk === 'High') {
    recs.push({ id: 'r1', priority: 'Urgent', text: 'Consider urgent neuroradiology review', rationale: 'CT Risk Score is elevated' });
  }
  if (inputs.pupils === 'Anisocoria' || icpRisk !== 'Low') {
    recs.push({ id: 'r2', priority: 'Urgent', text: 'Consider repeat neuro exam / pupillary checks q1h', rationale: 'Change in ICP/pupillary status' });
  }
  if (latest.artifactIndex > 30) {
    recs.push({ id: 'r3', priority: 'Routine', text: 'Review sedation level and EEG artifact sources', rationale: 'Signal quality is suboptimal' });
  }
  if (latest.seizureProb > 20) {
    recs.push({ id: 'r4', priority: 'Routine', text: 'Review continuous EEG for subclinical patterns', rationale: 'Elevated CNN seizure probability' });
  }
  if (recs.length === 0) {
    recs.push({ id: 'r0', priority: 'Routine', text: 'Continue current neurological observation protocol', rationale: 'Metrics are stable' });
  }

  const toggleAck = (id) => setAckedRecs(p => ({ ...p, [id]: !p[id] }));

  let ctRiskText = 'no acute abnormalities';
  const ctFindingsList = [ctInputs.edema && 'edema', ctInputs.midlineShift && 'midline shift', ctInputs.hemorrhage && 'hemorrhage'].filter(Boolean);
  if (ctFindingsList.length > 0) {
    ctRiskText = 'findings consistent with ' + ctFindingsList.join(', ');
  }

  return (
    <div className="p-margin bg-background min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Left Column: EEG & CT (Spans 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            
            {/* Left: EEG Monitor */}
            <section className="bg-surface-container rounded-lg border border-outline-variant flex flex-col p-md min-h-[420px]">
              <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                <div>
                  <h2 className="text-headline-md font-inter text-on-surface">Continuous EEG Monitor</h2>
                  <span className="text-body-sm font-inter text-on-surface-variant">10-20 Standard Montage</span>
                </div>
                <div className="flex items-center gap-sm bg-surface-container-highest px-sm py-xs rounded border border-outline-variant">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${latest.seizureProb > 30 ? 'bg-secondary' : 'bg-primary'}`} />
                  <span className={`text-label-caps font-grotesk ${latest.seizureProb > 30 ? 'text-secondary' : 'text-primary'}`}>
                    CNN Status: {latest.seizureProb > 30 ? 'Elevated Risk' : 'Stable'}
                  </span>
                </div>
              </header>

              <div className="flex-1 bg-surface-dim rounded border border-outline-variant relative overflow-hidden flex flex-col justify-between p-sm">
                {EEG_CHANNELS.map((ch, i) => (
                  <EEGTrack key={ch} label={ch} seed={i + 1} anomaly={latest.seizureProb > 30 && (i === 2 || i === 3)} />
                ))}

                {latest.artifactIndex > 30 && (
                  <div className="absolute top-1/4 right-8 bg-surface-container-high border border-secondary px-xs py-0.5 rounded text-secondary text-label-caps text-[10px] font-grotesk flex items-center gap-0.5 shadow">
                    <Info size={10} />
                    Artifact Detected
                  </div>
                )}
              </div>
            </section>

            {/* Right: CT Scan */}
            <section className="bg-surface-container rounded-lg border border-outline-variant flex flex-col p-md min-h-[420px]">
              <header className="flex justify-between items-center mb-md border-b border-outline-variant pb-sm">
                <div>
                  <h2 className="text-headline-md font-inter text-on-surface">CT Scan (TDM cérébrale)</h2>
                  <span className="text-body-sm font-inter text-on-surface-variant">Axial View - Non-Contrast</span>
                </div>
                <div className="flex items-center gap-xs bg-surface-variant p-0.5 rounded border border-outline-variant">
                  {['off', 'heatmap', 'contours'].map(m => (
                    <button
                      key={m}
                      onClick={() => setOverlayMode(m)}
                      className={`px-2 py-1 text-label-caps font-grotesk rounded transition-colors ${
                        overlayMode === m ? 'bg-surface-container-high text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </header>

              <div className="flex-1 bg-[#0f172a] rounded border border-outline-variant flex items-center justify-center relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                
                {/* Beautiful SVG representation of an Axial CT Scan */}
                <svg className="absolute w-[80%] max-w-[280px] h-auto drop-shadow-2xl" viewBox="0 0 200 200">
                  {/* Skull boundary */}
                  <path d="M100,20 C160,20 180,70 180,110 C180,160 140,180 100,180 C60,180 20,160 20,110 C20,70 40,20 100,20 Z" stroke="#cbd5e1" strokeWidth="4" fill="#1e293b" />
                  
                  {/* Inner brain tissue area */}
                  <path d="M100,24 C155,24 175,70 175,110 C175,156 138,176 100,176 C62,176 25,156 25,110 C25,70 45,24 100,24 Z" fill="#334155" opacity="0.6" />
                  
                  {/* Midline / Falx cerebri */}
                  <line x1="100" y1="24" x2="100" y2="176" stroke="#cbd5e1" strokeWidth="1" opacity="0.8" strokeDasharray="4 2" />
                  
                  {/* Ventricles (butterfly shape in the center) */}
                  <path d="M96,75 C85,55 75,65 82,90 C85,100 80,115 70,120 C85,125 96,110 96,85 Z" fill="#0f172a" opacity="0.9" />
                  <path d="M104,75 C115,55 125,65 118,90 C115,100 120,115 130,120 C115,125 104,110 104,85 Z" fill="#0f172a" opacity="0.9" />
                  
                  {/* Sulci details */}
                  <path d="M40,70 Q60,80 45,100" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M160,70 Q140,80 155,100" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M35,115 Q65,110 40,140" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M165,115 Q135,110 160,140" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M60,40 Q80,55 70,80" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M140,40 Q120,55 130,80" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>

                {/* AI Overlays Container */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  
                  {/* Contours Mode */}
                  {overlayMode === 'contours' && (
                    <svg className="w-[80%] max-w-[280px] h-auto drop-shadow-lg absolute" viewBox="0 0 200 200">
                      {ctInputs.edema && (
                        <>
                          <ellipse cx="65" cy="90" rx="15" ry="10" stroke="#f43f5e" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                          <ellipse cx="65" cy="90" rx="20" ry="15" stroke="#f43f5e" strokeWidth="1" fill="none" opacity="0.6" />
                          <ellipse cx="65" cy="90" rx="25" ry="20" stroke="#f43f5e" strokeWidth="0.5" fill="none" opacity="0.3" />
                          <text x="65" y="120" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">Edema</text>
                        </>
                      )}
                      {ctInputs.midlineShift && (
                        <>
                          <path d="M100,30 Q125,100 100,170" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeDasharray="4 4" />
                          <text x="125" y="140" fill="#fbbf24" fontSize="9" fontWeight="bold">Shift 6mm</text>
                        </>
                      )}
                    </svg>
                  )}

                  {/* Heatmap Mode */}
                  {overlayMode === 'heatmap' && (
                    <div className="relative w-[80%] max-w-[280px] aspect-square">
                      {ctInputs.edema && (
                        <>
                          <div className="absolute top-[35%] left-[20%] w-[30%] h-[30%] bg-error rounded-full blur-2xl opacity-40 mix-blend-plus-lighter" />
                          <div className="absolute top-[40%] left-[5%] bg-error-container border border-error px-1 py-0.5 rounded text-error text-[10px] font-bold flex items-center gap-1 shadow-lg pointer-events-auto">
                            <AlertTriangle size={12} />
                            Edema Suspected
                          </div>
                        </>
                      )}
                      {ctInputs.midlineShift && (
                        <div className="absolute top-[45%] left-[55%] bg-secondary-container border border-secondary px-1 py-0.5 rounded text-on-secondary-container text-[10px] font-bold flex items-center gap-1 shadow-lg pointer-events-auto">
                          <AlertTriangle size={12} />
                          Midline Shift
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              <div className="mt-sm flex justify-between text-on-surface-variant text-metric-unit font-grotesk">
                <span>Slice: 45/120</span>
                <span>Thickness: 5mm</span>
              </div>
            </section>
          </div>

          {/* Bottom: Automated Neuro-Summary */}
          <section className="bg-surface-container rounded-lg border border-outline-variant p-md">
            <header className="flex items-center gap-sm mb-sm">
              <Brain size={20} className="text-secondary" />
              <h3 className="text-headline-md font-inter text-on-surface">Automated Neuro-Summary</h3>
              <span className="bg-secondary-container text-on-secondary-container px-sm py-xs rounded text-label-caps text-[10px] font-grotesk ml-auto">
                AI Generated
              </span>
            </header>
            <div className="bg-surface-dim p-sm rounded border border-outline-variant">
              <p className="text-body-lg font-inter text-on-surface leading-relaxed">
                Continuous EEG indicates {eegBackground.toLowerCase()} background rhythms{latest.seizureProb > 30 ? ' with suspected evolving epileptiform activity' : ' with no epileptiform discharges detected'} in the
                last 4 hours. CT imaging analysis highlights {ctRiskText}. Combined analysis suggests a {icpRisk.toLowerCase()} immediate
                risk for ICP elevation, and neurological observation should be maintained according to recommendations.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: AI Neuro Metrics & Support */}
        <section className="bg-surface-container rounded-lg border border-outline-variant flex flex-col p-md h-full overflow-hidden">
          <header className="mb-md border-b border-outline-variant pb-sm shrink-0">
            <h2 className="text-headline-md font-inter text-on-surface flex items-center gap-2">
              <Brain size={20} className="text-primary"/>
              AI Neuro Metrics
            </h2>
            <span className="text-body-sm font-inter text-on-surface-variant">Real-time inference & risk</span>
          </header>

          <div className="flex flex-col gap-md overflow-y-auto pr-xs flex-1 pb-4">
            
            {/* Inputs */}
            <div className="bg-surface-dim rounded border border-outline-variant p-sm flex flex-col gap-sm">
              <span className="text-label-caps text-on-surface-variant font-grotesk">Clinical Context & Simulation Controls</span>
              <div className="flex flex-wrap gap-2">
                <ChipSelect label="Sedation" options={['None', 'Light', 'Deep']} value={inputs.sedation} onChange={v => setInputs(p=>({...p, sedation: v}))} />
                <ChipSelect label="Pupils" options={['Normal', 'Anisocoria']} value={inputs.pupils} onChange={v => setInputs(p=>({...p, pupils: v}))} />
                <ChipToggle label="Fever" active={inputs.fever==='Yes'} onChange={() => setInputs(p=>({...p, fever: p.fever==='Yes'?'No':'Yes'}))} />
                <ChipToggle label="Simulate Seizure" active={inputs.triggerSeizure} onChange={() => setInputs(p=>({...p, triggerSeizure: !p.triggerSeizure}))} />
                <ChipToggle label="Simulate Artifact" active={inputs.triggerArtifact} onChange={() => setInputs(p=>({...p, triggerArtifact: !p.triggerArtifact}))} />
              </div>
              <div className="flex flex-wrap gap-2 mt-1 pt-2 border-t border-dashed border-outline-variant">
                <span className="text-xs text-on-surface-variant w-full">CT Imaging Findings (Toggles AI Overlay):</span>
                <ChipToggle label="CT: Edema" active={ctInputs.edema} onChange={() => setCtInputs(p=>({...p, edema: !p.edema}))} />
                <ChipToggle label="CT: Shift" active={ctInputs.midlineShift} onChange={() => setCtInputs(p=>({...p, midlineShift: !p.midlineShift}))} />
                <ChipToggle label="CT: Hemorrhage" active={ctInputs.hemorrhage} onChange={() => setCtInputs(p=>({...p, hemorrhage: !p.hemorrhage}))} />
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-sm">
              <MetricCard 
                title="Seizure Prob." 
                value={`${latest.seizureProb.toFixed(1)}%`} 
                trend={seizureTrend} 
                sparkline={<Sparkline data={history.map(d=>d.seizureProb)} color={latest.seizureProb > 30 ? "#ffb690" : "#6bd8cb"}/>} 
                tooltip="Probability of non-convulsive seizure based on CNN analysis of 10-20 EEG" 
              />
              <MetricCard 
                title="Artifact Index" 
                value={`${latest.artifactIndex.toFixed(1)}%`} 
                trend={artifactTrend} 
                sparkline={<Sparkline data={history.map(d=>d.artifactIndex)} color="#a0a0a0"/>} 
                tooltip="Proportion of signal degraded by muscle or movement artifact" 
              />
              
              <div className="col-span-2 bg-surface-dim rounded border border-outline-variant p-sm flex justify-between items-center relative group">
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-48 bg-surface-container-high border border-outline-variant text-on-surface p-1.5 rounded text-[10px] shadow-lg z-10">
                  Predominant background rhythm classified by AI model
                </div>
                <div>
                  <div className="text-label-caps text-on-surface-variant font-grotesk mb-1 flex items-center gap-1">EEG Background <Info size={10} className="opacity-50"/></div>
                  <div className="text-body-md text-on-surface font-semibold">{eegBackground}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{eegRationale}</div>
                </div>
              </div>

              <div className="col-span-2 bg-surface-dim rounded border border-outline-variant p-sm flex justify-between items-center relative group">
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-48 bg-surface-container-high border border-outline-variant text-on-surface p-1.5 rounded text-[10px] shadow-lg z-10">
                  Risk score aggregated from imaging findings and physical exam
                </div>
                <div>
                  <div className="text-label-caps text-on-surface-variant font-grotesk mb-1 flex items-center gap-1">CT Risk Score <Info size={10} className="opacity-50"/></div>
                  <div className="text-body-md text-on-surface font-semibold">{ctRisk} / 10</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    Estimated ICP Risk:{' '}
                    <span className={icpRisk === 'High' ? 'text-error font-medium' : icpRisk === 'Moderate' ? 'text-secondary font-medium' : 'text-primary font-medium'}>
                      {icpRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-label-caps text-on-surface-variant font-grotesk">Clinical Alerts</span>
              {alerts.length === 0 && <div className="text-xs text-on-surface-variant p-2 bg-surface-dim rounded border border-dashed border-outline-variant">No active alerts</div>}
              {alerts.map(a => (
                <div key={a.id} className={`flex items-start gap-2 p-2 rounded border text-xs ${
                  a.type === 'Critical' ? 'bg-error-container border-error text-error' :
                  a.type === 'Warning' ? 'bg-secondary-container border-secondary text-on-secondary-container' :
                  'bg-surface-variant border-outline-variant text-on-surface'
                }`}>
                  <div className="mt-0.5">{a.icon}</div>
                  <div className="flex-1 font-medium">{a.text}</div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-label-caps text-on-surface-variant font-grotesk">Explainable Recommendations</span>
              {recs.map(r => (
                <div key={r.id} className="flex gap-2 items-start bg-surface-dim p-2 rounded border border-outline-variant transition-opacity" style={{opacity: ackedRecs[r.id] ? 0.6 : 1}}>
                  <button onClick={() => toggleAck(r.id)} className="mt-0.5 text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
                    {ackedRecs[r.id] ? <CheckSquare size={16} className="text-primary"/> : <Square size={16} />}
                  </button>
                  <div className="flex flex-col">
                    <div className="text-xs font-semibold text-on-surface flex items-center gap-2">
                      {r.priority === 'Urgent' && <span className="px-1 rounded text-[9px] uppercase bg-error text-on-error">Urgent</span>}
                      {r.text}
                    </div>
                    <div className="text-[10px] text-on-surface-variant mt-1 border-l-2 border-outline-variant pl-2">Rationale: {r.rationale}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
