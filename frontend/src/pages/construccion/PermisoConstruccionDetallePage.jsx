import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tramitesService } from '../../services/tramitesService'
import { useAuth } from '../../context/AuthContext'
import { useBadges } from '../../context/BadgeContext'
import EstadoBadge from '../../components/ui/EstadoBadge'
import Spinner from '../../components/ui/Spinner'
import { ArrowLeft, Clock, Building2 } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

export default function PermisoConstruccionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { refetch: refetchBadges } = useBadges()
  const [permiso, setPermiso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    tramitesService.getEstadoPermiso(id)
      .then(({ data }) => setPermiso(data))
      .catch(() => navigate('/construccion'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleObservacion = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tramitesService.agregarObservacion(id, { comentario: obs })
      const { data } = await tramitesService.getEstadoPermiso(id)
      setPermiso(data)
      setObs('')
      refetchBadges()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }
  if (!permiso) return null

  return (
    <div className="animate-fade-in-up space-y-5">
      <button
        onClick={() => navigate('/construccion')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} />
        Volver al listado
      </button>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="font-bold text-gray-900 dark:text-white">
              Permiso {permiso.numeroExpediente}
            </h1>
          </div>
          <EstadoBadge estado={permiso.estado} />
        </div>

        <div className="space-y-6 p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{permiso.tipoTramite?.nombre ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Fecha</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                {new Date(permiso.fechaSolicitud).toLocaleDateString('es-GT')}
              </dd>
            </div>
          </dl>

          {permiso.historial?.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Clock size={14} /> Historial
              </h2>
              <ol className="space-y-2">
                {permiso.historial.map((h, i) => (
                  <li
                    key={h.id}
                    className="animate-slide-in-left flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <EstadoBadge estado={h.estado} />
                    {h.comentario && (
                      <p className="flex-1 text-gray-600 dark:text-gray-400">{h.comentario}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {hasRole('OPERADOR', 'SUPERVISOR', 'ADMIN') && (
            <form onSubmit={handleObservacion} className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Agregar observación técnica</h2>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                required
                rows={3}
                placeholder="Observación técnica..."
                className={INPUT}
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <><Spinner size="sm" className="text-white" /><span>Guardando...</span></> : 'Agregar observación'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
