import { useEffect, useState } from 'react'
import { reportesService } from '../../services/reportesService'
import Spinner from '../../components/ui/Spinner'
import { Search, Download, FileBarChart, AlertCircle, CheckCircle, Clock, XCircle, Inbox } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'
const LABEL = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'

const ESTADO_BADGE = {
  RECIBIDA:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  EN_REVISION: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  APROBADA:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  RECHAZADA:   'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
}

const ESTADO_ICON = {
  RECIBIDA:    Inbox,
  EN_REVISION: Clock,
  APROBADA:    CheckCircle,
  RECHAZADA:   XCircle,
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}

export default function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [filtros, setFiltros] = useState({ desde: firstOfMonth, hasta: today, estado: '', tipoTramiteId: '' })
  const [tiposTramite, setTiposTramite] = useState([])
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    reportesService.getTiposTramite()
      .then(({ data }) => setTiposTramite(data.tiposTramite ?? data))
      .catch(() => {})
  }, [])

  const handleFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  const generar = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
      const { data } = await reportesService.getSolicitudes(params)
      setResultado(data)
    } catch {
      setError('No se pudo generar el reporte. Verifica los filtros e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const exportar = () => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    window.open(reportesService.exportUrl(params), '_blank')
  }

  const solicitudes = resultado?.solicitudes ?? []
  const stats = {
    total:      solicitudes.length,
    aprobadas:  solicitudes.filter(s => s.estado === 'APROBADA').length,
    enRevision: solicitudes.filter(s => s.estado === 'EN_REVISION').length,
    rechazadas: solicitudes.filter(s => s.estado === 'RECHAZADA').length,
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reportes de solicitudes</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Filtra y exporta el historial de trámites</p>
      </div>

      {/* Filtros */}
      <form onSubmit={generar} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={LABEL}>Desde</label>
            <input type="date" name="desde" value={filtros.desde} onChange={handleFiltro} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Hasta</label>
            <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltro} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Estado</label>
            <select name="estado" value={filtros.estado} onChange={handleFiltro} className={INPUT}>
              <option value="">Todos los estados</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="EN_REVISION">En revisión</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Tipo de trámite</label>
            <select name="tipoTramiteId" value={filtros.tipoTramiteId} onChange={handleFiltro} className={INPUT}>
              <option value="">Todos los tipos</option>
              {tiposTramite.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <><Spinner size="sm" className="text-white" /><span>Generando...</span></> : <><Search size={15} /><span>Generar reporte</span></>}
          </button>

          {resultado && (
            <button
              type="button"
              onClick={exportar}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={15} /> Exportar CSV
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {resultado && (
        <div className="animate-fade-in space-y-5">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total" value={stats.total} color="border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100" />
            <StatCard label="Aprobadas" value={stats.aprobadas} color="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400" />
            <StatCard label="En revisión" value={stats.enRevision} color="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400" />
            <StatCard label="Rechazadas" value={stats.rechazadas} color="border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400" />
          </div>

          {/* Tabla */}
          {solicitudes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
              <FileBarChart className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin solicitudes para los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Expediente</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="hidden px-4 py-3 md:table-cell">Ciudadano</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Funcionario</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {solicitudes.map((s, i) => {
                    const EstadoIcon = ESTADO_ICON[s.estado] ?? Inbox
                    return (
                      <tr
                        key={s.id}
                        className="animate-fade-in hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {s.numeroExpediente ?? `#${s.id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.tipoTramite?.nombre ?? s.tipo ?? '—'}</td>
                        <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-400 md:table-cell">
                          {s.ciudadano?.nombre ?? s.solicitante ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[s.estado] ?? ''}`}>
                            <EstadoIcon size={11} />
                            {s.estado?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-500 lg:table-cell">
                          {s.funcionario?.nombre ?? '—'}
                        </td>
                        <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-500 lg:table-cell">
                          {s.creadoEn
                            ? new Date(s.creadoEn).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
