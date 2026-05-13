import { useState, useRef } from 'react'
import {
  Badge, GitBranch, Calculator, HeartPulse, QrCode, Cpu, RefreshCw, Info, CheckCircle,
  Scan, Upload, X, AlertTriangle, FlaskConical, ShieldAlert, FileText
} from 'lucide-react'

const CT_FINDINGS = [
  { id: 'ich', label: 'ICH' },
  { id: 'ischemic', label: 'Ischemic Stroke' },
  { id: 'midline', label: 'Midline Shift' },
  { id: 'edema', label: 'Edema' },
  { id: 'mass', label: 'Mass Effect' },
  { id: 'hydro', label: 'Hydrocephalus' },
  { id: 'normal', label: 'Normal' },
]

const LAB_FIELDS = [
  { key: 'wbc',      label: 'WBC',        unit: '10⁹/L',  placeholder: '4–11',  ref: '4.0–11.0' },
  { key: 'hb',       label: 'Hb',         unit: 'g/dL',   placeholder: '12–17', ref: 'M:13.5–17 / F:12–15' },
  { key: 'plt',      label: 'Platelets',  unit: '10⁹/L',  placeholder: '150–400' },
  { key: 'crp',      label: 'CRP',        unit: 'mg/L',   placeholder: '<10' },
  { key: 'pct',      label: 'PCT',        unit: 'ng/mL',  placeholder: '<0.5' },
  { key: 'na',       label: 'Na⁺',        unit: 'mEq/L',  placeholder: '136–145', ref: '136–145' },
  { key: 'k',        label: 'K⁺',         unit: 'mEq/L',  placeholder: '3.5–5', ref: '3.5–5.0' },
  { key: 'cl',       label: 'Cl⁻',        unit: 'mEq/L',  placeholder: '98–107' },
  { key: 'creat',    label: 'Créatinine', unit: 'mg/dL',  placeholder: '0.7–1.3', ref: '0.7–1.3' },
  { key: 'urea',     label: 'Urée',       unit: 'mg/dL',  placeholder: '7–25' },
  { key: 'ast',      label: 'AST',        unit: 'U/L',    placeholder: '<40' },
  { key: 'alt',      label: 'ALT',        unit: 'U/L',    placeholder: '<56' },
  { key: 'bili',     label: 'Bilirubine', unit: 'mg/dL',  placeholder: '0.2–1.2' },
  { key: 'lactate',  label: 'Lactate',    unit: 'mmol/L', placeholder: '0.5–2', ref: '0.5–1.6' },
  { key: 'troponin', label: 'Troponine',  unit: 'ng/L',   placeholder: '<14' },
  { key: 'inr',      label: 'INR',        unit: '',       placeholder: '0.8–1.2' },
  { key: 'aptt',     label: 'aPTT',       unit: 's',      placeholder: '25–35' },
  { key: 'glucose',  label: 'Glucose',    unit: 'mg/dL',  placeholder: '70–110' },
]

const LAB_CSV_MAP = {
  wbc:'wbc', 'white blood cell':'wbc', hb:'hb', hemoglobin:'hb', haemoglobin:'hb',
  platelets:'plt', plt:'plt', crp:'crp', procalcitonin:'pct', pct:'pct',
  sodium:'na', 'na+':'na', na:'na', potassium:'k', 'k+':'k', k:'k',
  chloride:'cl', 'cl-':'cl', cl:'cl', creatinine:'creat', creat:'creat',
  urea:'urea', ast:'ast', alt:'alt', bilirubin:'bili', bili:'bili',
  lactate:'lactate', troponin:'troponin', inr:'inr', aptt:'aptt', glucose:'glucose',
}

function getAIImpression(findings) {
  if (!findings.length) return 'Sélectionnez des résultats pour générer une impression IA.'
  if (findings.includes('normal')) return 'Aucune pathologie intracrânienne aiguë identifiée sur le scanner.'
  const p = []
  if (findings.includes('ich'))      p.push('Hémorragie intracérébrale — consultation neurochirurgicale urgente.')
  if (findings.includes('ischemic')) p.push('Schéma ischémique aigu — évaluation thrombolyse à considérer.')
  if (findings.includes('midline'))  p.push('Déviation de la ligne médiane — monitorage PIC indiqué.')
  if (findings.includes('edema'))    p.push('Œdème cérébral — osmothérapie envisagée.')
  if (findings.includes('mass'))     p.push('Effet de masse — contrôle imagerie à 6h.')
  if (findings.includes('hydro'))    p.push('Hydrocéphalie — discuter mise en place DVE.')
  return p.join(' ') || 'Anomalies détectées — corrélation clinique recommandée.'
}

const etiologies = [
  { key: 'neuro', icon: '🧠', label: 'Neurological', sub: 'Trauma, CVA, ICH, Tumor' },
  { key: 'meta', icon: '⚗️', label: 'Metabolic', sub: 'DKA, Hepatic, Uremic' },
  { key: 'infect', icon: '🦠', label: 'Infectious', sub: 'Meningitis, Encephalitis, Sepsis' },
  { key: 'anoxic', icon: '💨', label: 'Anoxic / Toxic', sub: 'Cardiac Arrest, Overdose' },
]

const vitals = [
  { key: 'bp', label: 'BP', unit: 'mmHg', placeholder: '120/80' },
  { key: 'hr', label: 'HR', unit: 'bpm', placeholder: '72' },
  { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
  { key: 'temp', label: 'Temp', unit: '°C', placeholder: '36.8' },
  { key: 'glycemia', label: 'Glycemia', unit: 'mg/dL', placeholder: '110' },
  { key: 'na', label: 'Na+', unit: 'mEq/L', placeholder: '140' },
  { key: 'k', label: 'K+', unit: 'mEq/L', placeholder: '4.2' },
  { key: 'crp', label: 'CRP', unit: 'mg/L', placeholder: '--' },
]

export default function PatientAdmissionProfile() {
  const [selectedEtiology, setSelectedEtiology] = useState(null)
  const [gcs, setGcs] = useState({ eye: '', verbal: '', motor: '' })

  // TDM state
  const [tdmFile, setTdmFile]         = useState(null)
  const [tdmError, setTdmError]       = useState('')
  const [tdmDragging, setTdmDragging] = useState(false)
  const [tdmModal, setTdmModal]       = useState(false)
  const [tdmSummary, setTdmSummary]   = useState('')
  const [tdmFindings, setTdmFindings] = useState([])
  const tdmInputRef = useRef(null)

  const ALLOWED = ['.dcm', '.zip', '.png', '.jpg', '.jpeg']
  const handleTdmFile = (file) => {
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED.includes(ext)) { setTdmError(`Type non supporté: ${ext}. Acceptés: ${ALLOWED.join(', ')}`); return }
    setTdmError(''); setTdmFile(file)
  }
  const toggleFinding = (id) =>
    setTdmFindings(f => f.includes(id) ? f.filter(x => x !== id) : [...f.filter(x => x !== 'normal' || id === 'normal'), id])
  const tdmPreviewUrl = tdmFile && ['png','jpg','jpeg'].includes(tdmFile.name.split('.').pop().toLowerCase())
    ? URL.createObjectURL(tdmFile) : null

  // Lab state
  const [labs, setLabs]         = useState(Object.fromEntries(LAB_FIELDS.map(f => [f.key, ''])))
  const [csvWarn, setCsvWarn]   = useState('')
  const csvInputRef = useRef(null)
  const setLab = (k, v) => setLabs(l => ({ ...l, [k]: v }))

  const handleCsvImport = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split(/\r?\n/).filter(Boolean)
      const ignored = []
      const updates = {}
      lines.forEach(line => {
        const [rawName, rawVal] = line.split(',').map(s => s.trim())
        if (!rawName || !rawVal) return
        const mapped = LAB_CSV_MAP[rawName.toLowerCase()]
        if (mapped) updates[mapped] = rawVal
        else ignored.push(rawName)
      })
      setLabs(l => ({ ...l, ...updates }))
      setCsvWarn(ignored.length ? `Champs ignorés (non reconnus) : ${ignored.join(', ')}` : '')
    }
    reader.readAsText(file)
  }

  const n = (k) => parseFloat(labs[k])
  const sepsisFlags = [
    ...(!isNaN(n('wbc')) && (n('wbc') > 12 || n('wbc') < 4) ? [{ label: 'WBC anormal', level: 'warn' }] : []),
    ...(!isNaN(n('crp')) && n('crp') > 10  ? [{ label: 'CRP élevée', level: 'warn' }] : []),
    ...(!isNaN(n('pct')) && n('pct') > 0.5 ? [{ label: 'PCT élevée', level: 'warn' }] : []),
    ...(!isNaN(n('lactate')) && n('lactate') >= 2 ? [{ label: 'Lactate ≥2 mmol/L', level: 'crit' }] : []),
  ]

  const gcsTotal = [gcs.eye, gcs.verbal, gcs.motor]
    .map(Number)
    .filter(Boolean)
    .reduce((a, b) => a + b, 0)

  const gcsDisplay = gcsTotal > 0 ? gcsTotal : '--'

  return (
    <div className="p-margin bg-background min-h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md pb-md border-b border-outline-variant mb-lg">
        <div>
          <h1 className="text-headline-lg font-inter text-on-surface mb-unit">
            Patient Admission &amp; Clinical Profile
          </h1>
          <p className="text-on-surface-variant text-body-lg font-inter">
            Initialize new electronic health record and establish baseline parameters.
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="bg-surface-container-high text-on-surface border border-outline-variant px-md py-sm rounded text-label-caps font-grotesk flex items-center gap-sm hover:bg-surface-variant transition-colors">
            <QrCode size={16} />
            Scan Wristband
          </button>
          <button className="bg-primary-container text-on-primary-container px-md py-sm rounded text-label-caps font-grotesk font-bold flex items-center gap-sm hover:opacity-90 transition-opacity">
            <Cpu size={16} />
            Initialize AI Monitoring
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Sociodemographics + Etiology */}
        <div className="lg:col-span-8 flex flex-col gap-md">

          {/* Sociodemographics */}
          <section className="bg-surface-container border border-outline-variant rounded-lg p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
              <Badge size={18} className="text-primary" />
              <h2 className="text-headline-md font-inter text-on-surface">Sociodemographics</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
              <div className="flex flex-col">
                <label className="text-label-caps font-grotesk text-on-surface-variant mb-unit">Patient ID</label>
                <input
                  className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-lg font-inter focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase font-mono"
                  placeholder="Enter ID"
                  type="text"
                  defaultValue="PT-8472-X"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-caps font-grotesk text-on-surface-variant mb-unit">Age / DOB</label>
                <input
                  className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-lg font-inter focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="YY-MM-DD"
                  type="text"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-caps font-grotesk text-on-surface-variant mb-unit">Gender</label>
                <select className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-lg font-inter focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Unknown</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-label-caps font-grotesk text-on-surface-variant mb-unit">Region / Ward</label>
                <select className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-lg font-inter focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>ICU - North</option>
                  <option>ICU - South</option>
                  <option>Trauma Center</option>
                </select>
              </div>
            </div>
          </section>

          {/* Coma Etiology */}
          <section className="bg-surface-container border border-outline-variant rounded-lg p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
              <GitBranch size={18} className="text-primary" />
              <h2 className="text-headline-md font-inter text-on-surface">Suspected Coma Etiology</h2>
              <span className="bg-surface-variant text-on-surface-variant text-metric-unit font-grotesk px-sm py-unit rounded-full ml-auto">
                Select Primary
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-sm">
              {etiologies.map(({ key, icon, label, sub }) => (
                <button
                  key={key}
                  onClick={() => setSelectedEtiology(key)}
                  className={`border rounded p-sm flex flex-col items-start gap-sm transition-all text-left group ${
                    selectedEtiology === key
                      ? 'border-primary bg-surface-container-high'
                      : 'bg-surface-dim border-outline-variant hover:border-primary hover:bg-surface-container-high'
                  }`}
                >
                  <div className="w-full flex justify-between items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-lg ${
                      selectedEtiology === key
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-variant text-on-surface'
                    }`}>
                      {icon}
                    </div>
                    {selectedEtiology === key && (
                      <CheckCircle size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="w-full mt-sm">
                    <div className="text-headline-md font-inter text-on-surface">{label}</div>
                    <div className="text-body-sm font-inter text-on-surface-variant">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: GCS Calculator */}
        <div className="lg:col-span-4 flex flex-col gap-md">
          <section className="bg-surface-container border border-outline-variant rounded-lg p-md flex flex-col">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
              <Calculator size={18} className="text-secondary-container" />
              <h2 className="text-headline-md font-inter text-on-surface">GCS Baseline</h2>
              <div className="ml-auto bg-surface-dim px-sm py-unit rounded border border-outline-variant flex items-baseline gap-unit">
                <span className="text-headline-md font-inter text-secondary-container font-bold">{gcsDisplay}</span>
                <span className="text-metric-unit font-grotesk text-on-surface-variant">/15</span>
              </div>
            </div>
            <div className="flex flex-col gap-md flex-1">
              {/* Eye */}
              <div className="flex flex-col gap-unit">
                <label className="text-label-caps font-grotesk text-on-surface flex justify-between">
                  <span>Eye Response (E)</span>
                  <span className="text-on-surface-variant">1-4</span>
                </label>
                <select
                  className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-sm font-inter focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none"
                  value={gcs.eye}
                  onChange={e => setGcs(g => ({ ...g, eye: e.target.value }))}
                >
                  <option value="">Select Response...</option>
                  <option value="4">4 - Spontaneous</option>
                  <option value="3">3 - To Sound</option>
                  <option value="2">2 - To Pressure</option>
                  <option value="1">1 - None</option>
                  <option value="0">NT - Non Testable</option>
                </select>
              </div>
              {/* Verbal */}
              <div className="flex flex-col gap-unit">
                <label className="text-label-caps font-grotesk text-on-surface flex justify-between">
                  <span>Verbal Response (V)</span>
                  <span className="text-on-surface-variant">1-5</span>
                </label>
                <select
                  className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-sm font-inter focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none"
                  value={gcs.verbal}
                  onChange={e => setGcs(g => ({ ...g, verbal: e.target.value }))}
                >
                  <option value="">Select Response...</option>
                  <option value="5">5 - Orientated</option>
                  <option value="4">4 - Confused</option>
                  <option value="3">3 - Words</option>
                  <option value="2">2 - Sounds</option>
                  <option value="1">1 - None</option>
                  <option value="0">NT - Intubated</option>
                </select>
              </div>
              {/* Motor */}
              <div className="flex flex-col gap-unit">
                <label className="text-label-caps font-grotesk text-on-surface flex justify-between">
                  <span>Motor Response (M)</span>
                  <span className="text-on-surface-variant">1-6</span>
                </label>
                <select
                  className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-sm font-inter focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none"
                  value={gcs.motor}
                  onChange={e => setGcs(g => ({ ...g, motor: e.target.value }))}
                >
                  <option value="">Select Response...</option>
                  <option value="6">6 - Obeys Commands</option>
                  <option value="5">5 - Localising</option>
                  <option value="4">4 - Normal Flexion</option>
                  <option value="3">3 - Abnormal Flexion</option>
                  <option value="2">2 - Extension</option>
                  <option value="1">1 - None</option>
                  <option value="0">NT - Non Testable</option>
                </select>
              </div>
            </div>
            <div className="mt-md pt-sm border-t border-outline-variant text-center">
              <span className="text-body-sm font-inter text-on-surface-variant flex items-center justify-center gap-unit">
                <Info size={14} />
                Auto-calculates total score for timeline tracking.
              </span>
            </div>
          </section>
        </div>

        {/* Full-width: Baseline Parameters */}
        <div className="lg:col-span-12">
          <section className="bg-surface-container border border-outline-variant rounded-lg p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
              <HeartPulse size={18} className="text-primary" />
              <h2 className="text-headline-md font-inter text-on-surface">Baseline Parameters (Initial Entry)</h2>
              <button className="ml-auto bg-surface-variant text-on-surface hover:bg-surface-container-high px-sm py-unit rounded text-label-caps font-grotesk flex items-center gap-xs border border-outline-variant transition-colors">
                <RefreshCw size={13} />
                Pull from Monitor
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-sm">
              {vitals.map(({ key, label, unit, placeholder }) => (
                <div
                  key={key}
                  className="bg-surface-dim border border-outline-variant rounded p-sm flex flex-col justify-between group focus-within:border-primary transition-colors"
                >
                  <label className="text-label-caps font-grotesk text-on-surface-variant flex justify-between w-full">
                    {label}
                    <span className="text-metric-unit font-grotesk">{unit}</span>
                  </label>
                  <input
                    className="bg-transparent border-b border-transparent focus:border-primary text-on-surface text-headline-md font-inter outline-none mt-sm w-full text-center transition-colors"
                    placeholder={placeholder}
                    type="text"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── TDM (CT Scan) Section ── */}
      <section className="bg-surface-container border border-outline-variant rounded-lg p-md mt-md">
        <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
          <Scan size={18} className="text-primary" />
          <h2 className="text-headline-md font-inter text-on-surface">TDM (CT Scan)</h2>
          <button type="button" onClick={() => tdmInputRef.current?.click()}
            className="ml-auto bg-surface-variant text-on-surface hover:bg-surface-container-high px-sm py-unit rounded text-label-caps font-grotesk flex items-center gap-xs border border-outline-variant transition-colors">
            <Upload size={13} /> Import DICOM
          </button>
          <input ref={tdmInputRef} type="file" accept=".dcm,.zip,.png,.jpg,.jpeg" className="hidden"
            onChange={e => handleTdmFile(e.target.files[0])} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          {/* Upload zone */}
          <div className="flex flex-col gap-sm">
            <div
              onDragOver={e => { e.preventDefault(); setTdmDragging(true) }}
              onDragLeave={() => setTdmDragging(false)}
              onDrop={e => { e.preventDefault(); setTdmDragging(false); handleTdmFile(e.dataTransfer.files[0]) }}
              onClick={() => tdmInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-lg flex flex-col items-center justify-center gap-sm cursor-pointer transition-colors ${
                tdmDragging ? 'border-primary bg-primary-container/20' : 'border-outline-variant bg-surface-dim hover:border-primary'
              }`}>
              <FileText size={32} className="text-on-surface-variant" />
              <p className="text-body-sm font-inter text-on-surface-variant text-center">
                Glissez un fichier DICOM, ZIP ou image<br />
                <span className="text-metric-unit text-outline">.dcm · .zip · .png · .jpg</span>
              </p>
            </div>
            {tdmError && (
              <p className="text-body-sm font-inter text-error flex items-center gap-xs">
                <AlertTriangle size={14} /> {tdmError}
              </p>
            )}
            {tdmFile && !tdmError && (
              <div className="bg-surface-dim border border-outline-variant rounded p-sm flex items-center justify-between gap-sm">
                <div>
                  <p className="text-body-sm font-inter text-on-surface font-semibold">{tdmFile.name}</p>
                  <p className="text-metric-unit font-grotesk text-on-surface-variant">{(tdmFile.size / 1024).toFixed(1)} KB · Prêt</p>
                </div>
                <div className="flex gap-xs">
                  <button type="button" onClick={() => setTdmModal(true)}
                    className="bg-primary-container text-on-primary-container px-sm py-unit rounded text-label-caps font-grotesk hover:opacity-90">
                    Aperçu
                  </button>
                  <button type="button" onClick={() => setTdmFile(null)}
                    className="text-on-surface-variant hover:text-error transition-colors"><X size={16} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Interpretation form */}
          <div className="flex flex-col gap-sm">
            <div className="flex flex-col gap-unit">
              <label className="text-label-caps font-grotesk text-on-surface-variant">Résumé radiologique</label>
              <textarea rows={3} value={tdmSummary} onChange={e => setTdmSummary(e.target.value)}
                placeholder="Décrivez les observations principales..."
                className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-on-surface text-body-sm font-inter focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" />
            </div>
            <div className="flex flex-col gap-unit">
              <label className="text-label-caps font-grotesk text-on-surface-variant">Résultats clés</label>
              <div className="flex flex-wrap gap-xs">
                {CT_FINDINGS.map(f => (
                  <button key={f.id} type="button" onClick={() => toggleFinding(f.id)}
                    className={`px-sm py-unit rounded-full text-label-caps font-grotesk border transition-colors ${
                      tdmFindings.includes(f.id)
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'bg-surface-dim text-on-surface-variant border-outline-variant hover:border-primary'
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-unit">
              <label className="text-label-caps font-grotesk text-on-surface-variant">Impression assistée par IA</label>
              <div className="bg-surface-dim border border-outline-variant rounded px-sm py-sm text-body-sm font-inter text-on-surface-variant min-h-[56px]">
                {getAIImpression(tdmFindings)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TDM Preview Modal */}
      {tdmModal && (
        <div role="dialog" aria-modal="true" aria-label="Aperçu TDM"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-md"
          onClick={() => setTdmModal(false)}>
          <div className="bg-surface-container border border-outline-variant rounded-lg p-md max-w-lg w-full flex flex-col gap-md"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-headline-md font-inter text-on-surface">Aperçu — {tdmFile?.name}</h3>
              <button type="button" onClick={() => setTdmModal(false)}
                className="text-on-surface-variant hover:text-error transition-colors"><X size={20} /></button>
            </div>
            {tdmPreviewUrl
              ? <img src={tdmPreviewUrl} alt="CT preview" className="rounded-lg max-h-[60vh] object-contain w-full" />
              : <div className="bg-surface-dim border border-outline-variant rounded-lg p-lg text-center">
                  <Scan size={40} className="text-on-surface-variant mx-auto mb-sm" />
                  <p className="text-body-sm font-inter text-on-surface-variant">
                    L'aperçu DICOM nécessite une intégration de viewer (OHIF / Cornerstone).
                  </p>
                </div>
            }
          </div>
        </div>
      )}

      {/* ── Analyses biologiques Section ── */}
      <section className="bg-surface-container border border-outline-variant rounded-lg p-md mt-md">
        <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
          <FlaskConical size={18} className="text-primary" />
          <h2 className="text-headline-md font-inter text-on-surface">Analyses biologiques</h2>
          <button type="button" onClick={() => csvInputRef.current?.click()}
            className="ml-auto bg-surface-variant text-on-surface hover:bg-surface-container-high px-sm py-unit rounded text-label-caps font-grotesk flex items-center gap-xs border border-outline-variant transition-colors">
            <Upload size={13} /> Import CSV
          </button>
          <input ref={csvInputRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={e => handleCsvImport(e.target.files[0])} />
        </div>

        {csvWarn && (
          <div className="mb-md bg-surface-variant border border-outline-variant rounded p-sm flex items-start gap-sm">
            <AlertTriangle size={14} className="text-secondary shrink-0 mt-0.5" />
            <p className="text-body-sm font-inter text-on-surface-variant">{csvWarn}</p>
          </div>
        )}

        {/* Sepsis flags */}
        {sepsisFlags.length > 0 && (
          <div className="mb-md flex flex-wrap gap-xs items-center">
            <ShieldAlert size={15} className="text-error" />
            <span className="text-label-caps font-grotesk text-on-surface-variant mr-xs">Drapeaux sepsis :</span>
            {sepsisFlags.map((f, i) => (
              <span key={i} className={`px-sm py-unit rounded-full text-label-caps font-grotesk border ${
                f.level === 'crit'
                  ? 'bg-error-container text-on-error-container border-error'
                  : 'bg-secondary-container text-on-secondary-container border-secondary'
              }`}>{f.label}</span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-sm">
          {LAB_FIELDS.map(({ key, label, unit, placeholder, ref: refRange }) => (
            <div key={key}
              className="bg-surface-dim border border-outline-variant rounded p-sm flex flex-col gap-unit group focus-within:border-primary transition-colors">
              <label htmlFor={`lab-${key}`}
                className="text-label-caps font-grotesk text-on-surface-variant flex justify-between w-full">
                {label}
                <span className="text-metric-unit font-grotesk">{unit}</span>
              </label>
              <input id={`lab-${key}`} type="text"
                value={labs[key]} placeholder={placeholder}
                onChange={e => setLab(key, e.target.value)}
                className="bg-transparent border-b border-transparent focus:border-primary text-on-surface text-headline-md font-inter outline-none w-full text-center transition-colors" />
              {refRange && (
                <span className="text-[10px] font-grotesk text-outline leading-tight">{refRange}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Action Bar */}
      <div className="mt-lg pt-lg border-t border-outline-variant flex justify-end gap-md">
        <button type="button" className="bg-surface-variant text-on-surface px-lg py-sm rounded text-label-caps font-grotesk hover:bg-surface-container-high border border-outline-variant transition-colors">
          Save Draft
        </button>
        <button type="button" className="bg-primary-container text-on-primary-container px-xl py-sm rounded text-label-caps font-grotesk font-bold flex items-center gap-sm hover:opacity-90 transition-opacity">
          <Cpu size={16} />
          Initialize AI Monitoring
        </button>
      </div>
    </div>
  )
}
