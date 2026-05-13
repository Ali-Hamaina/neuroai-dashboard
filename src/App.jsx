import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import GlobalICUTriage from './pages/GlobalICUTriage'
import PatientAdmissionProfile from './pages/PatientAdmissionProfile'
import RealTimeMonitoring from './pages/RealTimeMonitoring'
import NeurologicalCNNAnalysis from './pages/NeurologicalCNNAnalysis'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/triage" replace />} />
        <Route path="triage" element={<GlobalICUTriage />} />
        <Route path="admission" element={<PatientAdmissionProfile />} />
        <Route path="monitoring" element={<RealTimeMonitoring />} />
        <Route path="neurological" element={<NeurologicalCNNAnalysis />} />
      </Route>
    </Routes>
  )
}
