import { useEffect, useState } from 'react'
import { reportesService } from '../../services/reportesService'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { History, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, Inbox, AlertCircle } from 'lucide-react'

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

function SolicitudCard({ solicitud, index }) {
  const [expandido, setExpandido] = useState(false)
  const EstadoIcon = ESTADO_ICON[solicitud.estado] ?? Inbox
  const historial = solicitud.historialEstados ?? solicitud.historial ?? []

  return (
    <div
      className="animate-fade-in-up rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
            {solicitud.numeroExpediente ?? `#${solicitud.id}`}
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {solicitud.tipoTramite?.nombre ?? solicitud.tipo ?? 'Trámite'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {solicitud.creadoEn
              ? new Date(solicitud.creadoEn).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
              : '—'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[solicitud.estado] ?? ''}`}>
            <EstadoIcon size={11} />
            {solicitud.estado?.replace('_', ' ')}
          </span>

          {historial.length > 0 && (
            <button
              onClick={() => setExpandido(!expandido)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Historial
              {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {expandido && historial.length > 0 && (
        <div className="animate-fade-in border-t border-gray-100 px-5 pb-4 pt-3 dark:border-gray-800">
          <ol className="space-y-2">
            {historial.map((h, i) => {
              const HIcon = ESTADO_ICON[h.estado] ?? Inbox
              return (
                <li
                  key={h.id ?? i}
                  className="animate-slide-in-left flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800/40"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <HIcon size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[h.estado] ?? ''}`}>
                      {h.estado?.replace('_', ' ')}
                    </span>
                    {h.comentario && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{h.comentario}</p>
                    )}
                    {h.observacion && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{h.observacion}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(h.creadoEn ?? h.fecha).toLocaleDateString('es-GT', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                      {h.funcionario?.nombre && ` · ${h.funcionario.nombre}`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}

export default function HistorialPage() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    reportesService.getHistorial(user.id)
      .then(({ data }) => setSolicitudes(data.solicitudes ?? data))
      .catch(() => setError('No se pudo cargar el historial de solicitudes'))
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div className="animate-fade-in-up space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mis solicitudes</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Cargando...' : `${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} registrada${solicitudes.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
        </div>
      ) : solicitudes.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
          <History className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No has realizado solicitudes todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s, i) => (
            <SolicitudCard key={s.id} solicitud={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
