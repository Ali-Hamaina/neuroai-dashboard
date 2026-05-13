import { useLocation } from 'react-router-dom'
import { Search, Cpu, Bell, UserCircle } from 'lucide-react'

const pageTitles = {
  '/triage': 'Global Patient Overview',
  '/admission': 'Patient Admission & Clinical Profile',
  '/monitoring': 'Real-Time Patient Monitoring',
  '/neurological': 'Neurological CNN AI Analysis',
}

export default function Header() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'NeuroAI ICU'

  return (
    <header className="bg-surface-dim w-full h-16 border-b border-outline-variant flex justify-between items-center px-margin sticky top-0 z-50 flex-shrink-0">
      <div className="text-headline-lg font-inter font-bold text-primary truncate">
        {title}
      </div>
      <div className="flex items-center gap-lg">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-sm text-on-surface-variant" />
          <input
            className="bg-surface-container-low border border-outline-variant text-on-surface pl-10 pr-4 py-sm text-body-sm font-inter w-56 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant rounded"
            placeholder="Search patients..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-sm text-primary">
          <button className="hover:bg-surface-container-high transition-colors p-sm rounded-full">
            <Cpu size={20} />
          </button>
          <button className="hover:bg-surface-container-high transition-colors p-sm rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
          <button className="hover:bg-surface-container-high transition-colors p-sm rounded-full">
            <UserCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
