import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tramitesService } from '../../services/tramitesService'
import { useAuth } from '../../context/AuthContext'
import EstadoBadge from '../../components/ui/EstadoBadge'
import Spinner from '../../components/ui/Spinner'
import { Building2, Plus, AlertCircle, ArrowRight } from 'lucide-react'

const ESTADOS = ['', 'RECIBIDA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'SUBSANACION']
const LABEL_ESTADO = { '': 'Todos', RECIBIDA: 'Recibida', EN_REVISION: 'En revisión', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', SUBSANACION: 'Subsanación' }

const SELECT = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'

const PALABRAS_CONSTRUCCION = ['construcción', 'obra', 'ampliación', 'remodelación']

export default function ConstruccionListPage() {
  const { hasRole } = useAuth()
  const esFuncionario = hasRole('OPERADOR', 'SUPERVISOR', 'ADMIN')
  const [todas, setTodas] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tramitesService.getMisSolicitudes()
      .then(({ data }) => {
        const lista = (data.solicitudes ?? data).filter(s =>
          PALABRAS_CONSTRUCCION.some(p => s.tipoTramite?.nombre?.toLowerCase().includes(p))
        )
        setTodas(lista)
      })
      .catch(() => setError('No se pudieron cargar los permisos'))
      .finally(() => setLoading(false))
  }, [])

  const solicitudes = filtroEstado ? todas.filter(s => s.estado === filtroEstado) : todas

  if (loading) return <div className="flex flex-1 items-center justify-center py-24"><Spinner size="lg" className="text-emerald-600 dark:text-emerald-400" /></div>

  if (error) return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
    </div>
  )

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Permisos de Construcción</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {solicitudes.length} permiso{solicitudes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={SELECT}>
            {ESTADOS.map(e => <option key={e} value={e}>{LABEL_ESTADO[e]}</option>)}
          </select>
          {hasRole('CIUDADANO') && (
            <Link
              to="/construccion/nuevo"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={16} /> Nuevo permiso
            </Link>
          )}
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
          <Building2 className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay permisos</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Expediente</th>
                <th className="px-4 py-3">Tipo</th>
                {esFuncionario && <th className="px-4 py-3">Ciudadano</th>}
                <th className="hidden px-4 py-3 sm:table-cell">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {solicitudes.map((s, i) => (
                <tr key={s.id} className="animate-fade-in hover:bg-gray-50/70 dark:hover:bg-gray-800/40" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{s.numeroExpediente}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.tipoTramite?.nombre}</td>
                  {esFuncionario && (
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{s.ciudadano?.nombre}</p>
                      <p className="text-xs text-gray-400">{s.ciudadano?.correo}</p>
                    </td>
                  )}
                  <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-500 sm:table-cell">
                    {new Date(s.fechaSolicitud).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={s.estado} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/construccion/${s.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                      Ver <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
