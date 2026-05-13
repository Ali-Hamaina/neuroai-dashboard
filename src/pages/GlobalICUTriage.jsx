import { useState } from 'react'
import { Users, AlertTriangle, Brain, Filter, CheckCircle, Info } from 'lucide-react'

const patients = [
  {
    id: 'PT-1042',
    bed: 'Bed 12',
    etiology: 'Neurological',
    gcs: 5,
    status: 'critical',
    alertType: 'critical',
    alertTitle: 'Critical AI Alert',
    alertMsg: '85% Cardio Risk - High CRP detected. Immediate intervention recommended.',
    hr: 135,
    spo2: 91,
    map: 65,
    hrColor: 'text-error',
    spo2Color: 'text-secondary',
  },
  {
    id: 'PT-2819',
    bed: 'Bed 04',
    etiology: 'Metabolic',
    gcs: 9,
    status: 'warning',
    alertType: 'warning',
    alertTitle: 'Predictive Warning',
    alertMsg: 'SpO2 Drop Predicted within next 30 mins based on respiratory trend.',
    hr: 88,
    spo2: 94,
    map: 72,
    hrColor: 'text-on-surface',
    spo2Color: 'text-secondary',
  },
  {
    id: 'PT-3301',
    bed: 'Bed 08',
    etiology: 'Anoxic',
    gcs: 12,
    status: 'stable',
    alertType: 'stable',
    alertTitle: null,
    alertMsg: null,
    hr: 72,
    spo2: 98,
    map: 85,
    hrColor: 'text-on-surface',
    spo2Color: 'text-on-surface',
  },
  {
    id: 'PT-4105',
    bed: 'Bed 02',
    etiology: 'Infectious',
    gcs: 14,
    status: 'stable',
    alertType: 'stable',
    alertTitle: null,
    alertMsg: null,
    hr: 68,
    spo2: 99,
    map: 78,
    hrColor: 'text-on-surface',
    spo2Color: 'text-on-surface',
  },
]

const statusStyles = {
  critical: {
    card: 'border-error-container',
    bar: 'bg-error',
    gcsColor: 'text-error',
    alertIcon: <AlertTriangle size={16} className="text-error" />,
    alertText: 'text-error',
  },
  warning: {
    card: 'border-secondary-container',
    bar: 'bg-secondary',
    gcsColor: 'text-secondary',
    alertIcon: <Info size={16} className="text-secondary" />,
    alertText: 'text-secondary',
  },
  stable: {
    card: 'border-outline-variant',
    bar: null,
    gcsColor: 'text-primary',
    alertIcon: null,
    alertText: '',
  },
}

export default function GlobalICUTriage() {
  const [filter, setFilter] = useState('all')

  const filtered = patients.filter(p => {
    if (filter === 'high') return p.status !== 'stable'
    if (filter === 'stable') return p.status === 'stable'
    return true
  })

  return (
    <div className="p-margin bg-background min-h-full">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        <div className="bg-surface-container p-md border border-outline-variant flex flex-col justify-between rounded">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-grotesk text-on-surface-variant uppercase">Total Patients</span>
            <Users size={20} className="text-primary" />
          </div>
          <div className="text-display-vitals font-inter text-on-surface">24</div>
        </div>
        <div className="bg-surface-container p-md border border-error-container relative overflow-hidden flex flex-col justify-between rounded">
          <div className="absolute inset-0 bg-error opacity-5" />
          <div className="flex items-center justify-between mb-sm relative z-10">
            <span className="text-label-caps font-grotesk text-error uppercase">Critical Alerts</span>
            <AlertTriangle size={20} className="text-error" />
          </div>
          <div className="text-display-vitals font-inter text-error relative z-10">3</div>
        </div>
        <div className="bg-surface-container p-md border border-secondary-container relative overflow-hidden flex flex-col justify-between rounded">
          <div className="absolute inset-0 bg-secondary-container opacity-5" />
          <div className="flex items-center justify-between mb-sm relative z-10">
            <span className="text-label-caps font-grotesk text-secondary uppercase">Active AI Warnings</span>
            <Brain size={20} className="text-secondary" />
          </div>
          <div className="text-display-vitals font-inter text-secondary relative z-10">8</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-xs text-label-caps font-grotesk py-sm px-md border rounded transition-colors ${filter === 'all' ? 'bg-surface-container-high text-on-surface border-outline-variant' : 'bg-surface-container text-on-surface border-outline-variant hover:bg-surface-container-high'}`}
          >
            <Filter size={14} /> All Patients
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`text-label-caps font-grotesk py-sm px-md border rounded transition-colors ${filter === 'high' ? 'bg-surface-container-high text-on-surface border-outline-variant' : 'bg-surface-container text-on-surface border-outline-variant hover:bg-surface-container-high'}`}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilter('stable')}
            className={`text-label-caps font-grotesk py-sm px-md border rounded transition-colors ${filter === 'stable' ? 'bg-surface-container-high text-on-surface border-outline-variant' : 'bg-surface-container text-on-surface border-outline-variant hover:bg-surface-container-high'}`}
          >
            Stable
          </button>
          <div className="h-6 w-px bg-outline-variant mx-sm" />
          <select className="bg-surface-container text-on-surface text-label-caps font-grotesk py-sm px-md border border-outline-variant focus:outline-none focus:border-primary rounded">
            <option>Etiology: All</option>
            <option>Metabolic</option>
            <option>Anoxic</option>
            <option>Neurological</option>
            <option>Infectious</option>
          </select>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        {filtered.map((patient) => {
          const styles = statusStyles[patient.status]
          return (
            <div
              key={patient.id}
              className={`bg-surface-container border ${styles.card} p-md flex flex-col gap-md relative rounded cursor-pointer hover:bg-surface-container-high transition-colors`}
            >
              {/* Status Bar */}
              {styles.bar && (
                <div className={`absolute top-0 left-0 w-1 h-full ${styles.bar} rounded-l`} />
              )}

              {/* Header */}
              <div className="flex justify-between items-start pl-2">
                <div>
                  <div className="flex items-center gap-sm mb-xs">
                    <span className="text-headline-md font-inter text-on-surface">{patient.id}</span>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-metric-unit font-grotesk border border-outline-variant">
                      {patient.bed}
                    </span>
                  </div>
                  <span className="text-label-caps font-grotesk text-on-surface-variant">
                    Etiology: {patient.etiology}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-label-caps font-grotesk text-on-surface-variant block mb-xs">GCS Score</span>
                  <span className={`text-headline-lg font-inter ${styles.gcsColor}`}>{patient.gcs}</span>
                </div>
              </div>

              {/* Alert Box */}
              {patient.alertTitle ? (
                <div className="bg-surface-dim p-sm border border-outline-variant rounded">
                  <div className={`flex items-center gap-sm ${styles.alertText} mb-xs`}>
                    {styles.alertIcon}
                    <span className="text-label-caps font-grotesk">{patient.alertTitle}</span>
                  </div>
                  <p className="text-body-sm font-inter text-on-surface">{patient.alertMsg}</p>
                </div>
              ) : (
                <div className="flex-1 border border-outline-variant bg-surface-dim flex items-center justify-center p-sm min-h-[60px] rounded">
                  <span className="text-label-caps font-grotesk text-on-surface-variant flex items-center gap-xs">
                    <CheckCircle size={14} className="text-primary" /> Stable - No Active Alerts
                  </span>
                </div>
              )}

              {/* Vitals */}
              <div className="grid grid-cols-3 gap-sm mt-auto">
                <div className="bg-surface-container-low p-sm border border-outline-variant text-center rounded">
                  <span className="block text-metric-unit font-grotesk text-on-surface-variant mb-xs">HR (bpm)</span>
                  <span className={`text-headline-md font-inter ${patient.hrColor}`}>{patient.hr}</span>
                </div>
                <div className="bg-surface-container-low p-sm border border-outline-variant text-center rounded">
                  <span className="block text-metric-unit font-grotesk text-on-surface-variant mb-xs">SpO2 (%)</span>
                  <span className={`text-headline-md font-inter ${patient.spo2Color}`}>{patient.spo2}</span>
                </div>
                <div className="bg-surface-container-low p-sm border border-outline-variant text-center rounded">
                  <span className="block text-metric-unit font-grotesk text-on-surface-variant mb-xs">MAP (mmHg)</span>
                  <span className="text-headline-md font-inter text-on-surface">{patient.map}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
