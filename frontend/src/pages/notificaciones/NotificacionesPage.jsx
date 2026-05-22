import { useEffect, useState } from 'react'
import { tramitesService } from '../../services/tramitesService'
import { useBadges } from '../../context/BadgeContext'
import EstadoBadge from '../../components/ui/EstadoBadge'
import Spinner from '../../components/ui/Spinner'
import { Bell, AlertCircle } from 'lucide-react'

export default function NotificacionesPage() {
  const { refetch: refetchBadges } = useBadges()
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem('notif_seen_at', new Date().toISOString())
    refetchBadges()

    tramitesService.getNotificaciones()
      .then(({ data }) => setNotificaciones(data))
      .catch(() => setError('No se pudieron cargar las notificaciones'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {notificaciones.length} actualización{notificaciones.length !== 1 ? 'es' : ''} en tus trámites
        </p>
      </div>

      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
          <Bell className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin notificaciones</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Los cambios en tus trámites aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n, i) => (
            <div
              key={n.id}
              className="animate-fade-in flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {n.solicitud.numeroExpediente}
                  </span>
                  <EstadoBadge estado={n.estado} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {n.solicitud.tipoTramite.nombre}
                </p>
                {n.comentario && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">{n.comentario}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  {new Date(n.creadoEn).toLocaleDateString('es-GT', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
