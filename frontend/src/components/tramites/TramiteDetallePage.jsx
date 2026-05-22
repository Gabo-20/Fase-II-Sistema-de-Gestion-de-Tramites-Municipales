import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tramitesService } from '../../services/tramitesService'
import { useAuth } from '../../context/AuthContext'
import EstadoBadge from '../ui/EstadoBadge'
import Spinner from '../ui/Spinner'
import { ArrowLeft, Clock, User, FileText, CreditCard } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

export default function TramiteDetallePage({ backPath, backLabel = 'Volver al listado', esMulta = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole, user } = useAuth()
  const [solicitud, setSolicitud] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolucion, setResolucion] = useState({ accion: '', comentario: '' })
  const [saving, setSaving] = useState(false)
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  useEffect(() => {
    tramitesService.getSolicitudById(id)
      .then(({ data }) => setSolicitud(data))
      .catch(() => navigate(backPath))
      .finally(() => setLoading(false))
  }, [id, navigate, backPath])

  const handleResolver = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tramitesService.aprobarRechazarLicencia(id, resolucion)
      const { data } = await tramitesService.getSolicitudById(id)
      setSolicitud(data)
      setResolucion({ accion: '', comentario: '' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
    </div>
  )
  if (!solicitud) return null

  const puedeResolver =
    hasRole('OPERADOR', 'SUPERVISOR', 'ADMIN') &&
    ['RECIBIDA', 'EN_REVISION', 'SUBSANACION'].includes(solicitud.estado)

  const puedePagar =
    esMulta &&
    hasRole('CIUDADANO') &&
    solicitud.estado === 'RECIBIDA' &&
    solicitud.ciudadanoId === user?.id

  const handlePago = async () => {
    setErrorPago('')
    setPagando(true)
    try {
      await tramitesService.registrarPago(id)
      const { data } = await tramitesService.getSolicitudById(id)
      setSolicitud(data)
    } catch (err) {
      setErrorPago(err.response?.data?.error ?? 'No se pudo registrar el pago')
    } finally {
      setPagando(false)
    }
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} />
        {backLabel}
      </button>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            <h1 className="font-bold text-gray-900 dark:text-white">
              Expediente {solicitud.numeroExpediente}
            </h1>
          </div>
          <EstadoBadge estado={solicitud.estado} />
        </div>

        <div className="space-y-6 p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Tipo de trámite</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{solicitud.tipoTramite?.nombre ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Fecha de solicitud</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-GT')}
              </dd>
            </div>
            {solicitud.ciudadano && hasRole('OPERADOR', 'SUPERVISOR', 'ADMIN') && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  <User size={11} /> Ciudadano
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{solicitud.ciudadano.nombre}</dd>
                <dd className="text-xs text-gray-400">{solicitud.ciudadano.correo}</dd>
              </div>
            )}
            {solicitud.funcionario && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  <User size={11} /> Funcionario asignado
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{solicitud.funcionario.nombre}</dd>
              </div>
            )}
          </dl>

          {solicitud.historial?.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Clock size={14} /> Historial de estados
              </h2>
              <ol className="space-y-2">
                {solicitud.historial.map((h, i) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <EstadoBadge estado={h.estado} />
                    <div className="min-w-0 flex-1">
                      {h.comentario && <p className="text-gray-600 dark:text-gray-400">{h.comentario}</p>}
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(h.creadoEn).toLocaleString('es-GT')}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {puedePagar && (
            <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <CreditCard size={14} /> Pago de multa
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Al confirmar, se notificará al funcionario para que verifique el pago recibido.
              </p>
              {errorPago && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  {errorPago}
                </p>
              )}
              <button
                type="button"
                onClick={handlePago}
                disabled={pagando}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pagando
                  ? <><Spinner size="sm" className="text-white" /><span>Registrando...</span></>
                  : <><CreditCard size={15} /><span>Registrar pago</span></>}
              </button>
            </div>
          )}

          {puedeResolver && (
            <form onSubmit={handleResolver} className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resolución</h2>
              <select
                value={resolucion.accion}
                onChange={(e) => setResolucion({ ...resolucion, accion: e.target.value })}
                required
                className={INPUT}
              >
                <option value="">Selecciona acción...</option>
                <option value="EN_REVISION">Poner en revisión</option>
                <option value="APROBADA">Aprobar</option>
                <option value="RECHAZADA">Rechazar</option>
                <option value="SUBSANACION">Solicitar subsanación</option>
              </select>
              <textarea
                value={resolucion.comentario}
                onChange={(e) => setResolucion({ ...resolucion, comentario: e.target.value })}
                rows={2}
                required
                placeholder="Comentario requerido..."
                className={INPUT}
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <><Spinner size="sm" className="text-white" /><span>Guardando...</span></> : 'Confirmar resolución'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
