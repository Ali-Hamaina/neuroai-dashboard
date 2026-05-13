import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UserPlus,
  Activity,
  Brain,
  Settings,
  HelpCircle,
  AlertTriangle,
  Cpu,
} from 'lucide-react'

const navItems = [
  { path: '/triage', label: 'Triage Dashboard', icon: LayoutDashboard },
  { path: '/admission', label: 'Patient Admission', icon: UserPlus },
  { path: '/monitoring', label: 'Real-Time Monitoring', icon: Activity },
  { path: '/neurological', label: 'Neurological Analysis', icon: Brain },
]

export default function Sidebar() {
  return (
    <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col py-xl z-40">
      {/* Brand */}
      <div className="px-md mb-xl flex items-center gap-md">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
          <Brain size={22} className="text-on-primary-container" />
        </div>
        <div>
          <h1 className="text-headline-md font-inter font-bold text-primary leading-tight">NeuroAI ICU</h1>
          <p className="text-label-caps font-grotesk text-primary-fixed-dim flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            AI Engine: Active
          </p>
        </div>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto px-sm">
        <ul className="space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-md px-md py-sm rounded transition-all duration-150 text-label-caps font-grotesk active:scale-95 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold border-l-4 border-primary pl-[12px]'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-md mt-4">
        <button className="w-full bg-error text-on-error text-label-caps font-grotesk py-sm px-md flex items-center justify-center gap-sm transition-all active:scale-95 border border-error-container hover:bg-error-container hover:text-on-error-container mb-md rounded">
          <AlertTriangle size={16} />
          Emergency Alert
        </button>
        <ul className="space-y-1">
          <li>
            <a href="#" className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-150 text-label-caps font-grotesk rounded">
              <Settings size={16} />
              Settings
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-150 text-label-caps font-grotesk rounded">
              <HelpCircle size={16} />
              Support
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
