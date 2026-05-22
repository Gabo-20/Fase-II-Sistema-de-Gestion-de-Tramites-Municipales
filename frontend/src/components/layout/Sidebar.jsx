import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBadges } from '../../context/BadgeContext'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Map,
  Bell,
  X,
  Landmark,
  Users,
  Receipt,
  BadgeCheck,
  AlertTriangle,
  Home,
  Tag,
  CalendarClock,
  BarChart2,
  History,
} from 'lucide-react'

// badge(badges, rol) → número a mostrar, o 0 para no mostrar
const NAV = [
  { to: '/dashboard',            label: 'Inicio',          Icon: LayoutDashboard, roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'],
    badge: (b, rol) => rol !== 'CIUDADANO' ? (b.total ?? 0) : 0 },
  { to: '/licencias',            label: 'Licencias',       Icon: FileText,        roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/construccion',         label: 'Construcción',    Icon: Building2,       roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/impuestos',            label: 'Pago IUSI',       Icon: Receipt,         roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/solvencia',            label: 'Solvencia',       Icon: BadgeCheck,      roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/multas',               label: 'Multas',          Icon: AlertTriangle,   roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'],
    badge: (b, rol) => rol === 'CIUDADANO' ? (b.multas ?? 0) : 0 },
  { to: '/residencia',           label: 'Residencia',      Icon: Home,            roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/rotulo',               label: 'Rótulos',         Icon: Tag,             roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/licencias-temporales', label: 'Lic. Temporales', Icon: CalendarClock,   roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/catastro',             label: 'Catastro',        Icon: Map,             roles: ['OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/reportes',             label: 'Reportes',        Icon: BarChart2,       roles: ['OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/historial',            label: 'Mis solicitudes', Icon: History,         roles: ['CIUDADANO'] },
  { to: '/notificaciones',       label: 'Notificaciones',  Icon: Bell,            roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { to: '/admin/usuarios',       label: 'Usuarios',        Icon: Users,           roles: ['ADMIN'] },
]

function BadgeDot({ count }) {
  if (!count) return null
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Sidebar({ open, onClose }) {
  const { hasRole, user } = useAuth()
  const { badges } = useBadges()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
        'border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        'transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Landmark size={16} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">Municipalidad</p>
            <p className="text-[10px] leading-tight text-gray-400 dark:text-gray-500">Trámites en línea</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.filter((n) => hasRole(...n.roles)).map(({ to, label, Icon, badge }) => {
            const count = badge ? badge(badges, user?.rol) : 0
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                      <span className="flex-1">{label}</span>
                      <BadgeDot count={count} />
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
