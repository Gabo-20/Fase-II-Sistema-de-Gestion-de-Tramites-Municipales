import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useBadges } from '../../context/BadgeContext'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import Spinner from '../../components/ui/Spinner'
import EstadoBadge from '../../components/ui/EstadoBadge'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  FileText, Building2, Map, Bell, ChevronRight,
  Users, ClipboardList, CheckCircle2, Clock, AlertCircle,
  Receipt, BadgeCheck, AlertTriangle, Home, Tag, CalendarClock,
} from 'lucide-react'

// ── Tarjetas de módulos (ciudadano) ────────────────────────────────────────────
const CARDS = [
  { title: 'Licencias Comerciales',   desc: 'Solicita, renueva o consulta el estado de tus licencias.',            href: '/licencias',           Icon: FileText,       accent: 'border-blue-200 dark:border-blue-900/50',    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',         roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Permisos de Construcción',desc: 'Gestiona permisos de obra y consulta su avance.',                     href: '/construccion',        Icon: Building2,      accent: 'border-emerald-200 dark:border-emerald-900/50', iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Pago de IUSI',            desc: 'Gestiona el impuesto único sobre inmuebles.',                         href: '/impuestos',           Icon: Receipt,        accent: 'border-orange-200 dark:border-orange-900/50',  iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',  roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Certificado de Solvencia',desc: 'Solicita constancias de solvencia municipal.',                        href: '/solvencia',           Icon: BadgeCheck,     accent: 'border-teal-200 dark:border-teal-900/50',      iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',         roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Pago de Multas',          desc: 'Consulta y cancela multas municipales pendientes.',                   href: '/multas',              Icon: AlertTriangle,  accent: 'border-red-200 dark:border-red-900/50',        iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',             roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Constancia de Residencia',desc: 'Obtén tu certificado de residencia municipal.',                       href: '/residencia',          Icon: Home,           accent: 'border-indigo-200 dark:border-indigo-900/50',  iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Permiso de Rótulo',       desc: 'Autorización para instalación de rótulos y publicidad.',              href: '/rotulo',              Icon: Tag,            accent: 'border-pink-200 dark:border-pink-900/50',      iconBg: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',         roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Licencias Temporales',    desc: 'Permisos de operación temporal para eventos y actividades.',          href: '/licencias-temporales',Icon: CalendarClock,  accent: 'border-violet-200 dark:border-violet-900/50',  iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Catastro Municipal',      desc: 'Administración de inmuebles y propietarios.',                         href: '/catastro',            Icon: Map,            accent: 'border-amber-200 dark:border-amber-900/50',    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',     roles: ['OPERADOR','SUPERVISOR','ADMIN'] },
  { title: 'Notificaciones',          desc: 'Revisa actualizaciones y avisos de tus trámites.',                    href: '/notificaciones',      Icon: Bell,           accent: 'border-purple-200 dark:border-purple-900/50',  iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', roles: ['CIUDADANO','OPERADOR','SUPERVISOR','ADMIN'] },
]

const ROLE_LABELS = { CIUDADANO: 'Ciudadano', OPERADOR: 'Operador', SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' }

// ── Colores por estado ─────────────────────────────────────────────────────────
const COLOR_ESTADO = {
  RECIBIDA:    '#6B7280',
  EN_REVISION: '#F59E0B',
  APROBADA:    '#10B981',
  RECHAZADA:   '#EF4444',
  SUBSANACION: '#F97316',
}
const LABEL_ESTADO = { RECIBIDA: 'Recibida', EN_REVISION: 'En revisión', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', SUBSANACION: 'Subsanación' }

// ── Tooltip personalizado ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {label && <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill ?? p.color }} className="font-semibold">
          {p.name ?? ''} {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Tarjeta contadora ──────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, iconCls, borderCls, loading, pulse = false }) {
  return (
    <div className={`relative rounded-xl border bg-white p-5 dark:bg-gray-900 ${borderCls}`}>
      {pulse && !loading && value > 0 && (
        <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          {loading
            ? <div className="mt-2"><Spinner size="sm" className="text-gray-400" /></div>
            : <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{value ?? '—'}</p>
          }
        </div>
        <div className={`rounded-xl p-2.5 ${iconCls}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

// ── Vista ciudadano ────────────────────────────────────────────────────────────
function CiudadanoDashboard({ user, hasRole }) {
  const { badges } = useBadges()
  const cards = CARDS.filter((c) => hasRole(...c.roles))

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.nombre?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Accede a los módulos disponibles para tu perfil de{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{ROLE_LABELS[user?.rol]}</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ href, title, desc, Icon, accent, iconBg }, i) => {
          const isMultas = href === '/multas'
          const multaCount = isMultas ? (badges.multas ?? 0) : 0
          return (
            <Link
              key={href}
              to={href}
              style={{ animationDelay: `${i * 55}ms` }}
              className={`group relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${accent}`}
            >
              {multaCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-md ring-2 ring-white dark:ring-gray-900">
                  {multaCount > 99 ? '99+' : multaCount}
                </span>
              )}
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={20} />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <span>Ir al módulo</span>
                <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Vista staff (operador/supervisor/admin) ────────────────────────────────────
function StaffDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardService.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => setError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  const pendientes = stats
    ? (stats.porEstado.find(e => e.estado === 'RECIBIDA')?.total ?? 0) +
      (stats.porEstado.find(e => e.estado === 'EN_REVISION')?.total ?? 0)
    : null

  const aprobadas = stats?.porEstado.find(e => e.estado === 'APROBADA')?.total ?? null

  const pieData = stats?.porEstado.map(e => ({
    name: LABEL_ESTADO[e.estado] ?? e.estado,
    value: e.total,
    fill: COLOR_ESTADO[e.estado] ?? '#6B7280',
  })) ?? []

  const barData = stats?.porTipo.map(t => ({ name: t.nombre, total: t.total })) ?? []

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.nombre?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Panel de control — <span className="font-medium text-gray-700 dark:text-gray-300">{ROLE_LABELS[user?.rol]}</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Tarjetas contadoras */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total solicitudes" value={stats?.totalSolicitudes} Icon={ClipboardList} iconCls="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"   borderCls="border-blue-200 dark:border-blue-900/50"   loading={loading} />
        <StatCard label="Usuarios"          value={stats?.totalUsuarios}    Icon={Users}          iconCls="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" borderCls="border-purple-200 dark:border-purple-900/50" loading={loading} />
        <StatCard label="Aprobadas"         value={aprobadas}               Icon={CheckCircle2}   iconCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" borderCls="border-emerald-200 dark:border-emerald-900/50" loading={loading} />
        <StatCard label="Pendientes"        value={pendientes}              Icon={Clock}          iconCls="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"   borderCls="border-amber-200 dark:border-amber-900/50"   loading={loading} pulse />
      </div>

      {/* Gráficas */}
      {!loading && stats && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Dona — por estado */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Solicitudes por estado</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Barras horizontales — por tipo */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Solicitudes por tipo</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="total" name="Solicitudes" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      {!loading && stats?.recientes?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Actividad reciente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3">Expediente</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="hidden px-5 py-3 md:table-cell">Ciudadano</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.recientes.map((s, i) => (
                  <tr
                    key={s.id}
                    className="animate-fade-in hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{s.numeroExpediente}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{s.tipoTramite?.nombre}</td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{s.ciudadano?.nombre}</p>
                      <p className="text-xs text-gray-400">{s.ciudadano?.correo}</p>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-gray-500 dark:text-gray-500 sm:table-cell">
                      {new Date(s.fechaSolicitud).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={s.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Export principal ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, hasRole } = useAuth()

  if (hasRole('OPERADOR', 'SUPERVISOR', 'ADMIN')) {
    return <StaffDashboard user={user} />
  }
  return <CiudadanoDashboard user={user} hasRole={hasRole} />
}
