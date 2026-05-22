import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { tramitesService } from '../../services/tramitesService'
import Spinner from '../ui/Spinner'
import { AlertCircle, ArrowLeft } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'
const norm = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function NuevoTramitePage({ titulo, keywords, backPath, detallePath, refLabel, refPlaceholder, refRequired = false }) {
  const navigate = useNavigate()
  const [tipos, setTipos] = useState([])
  const [tipoTramiteId, setTipoTramiteId] = useState('')
  const [referencia, setReferencia] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(true)

  useEffect(() => {
    api.get('/tipos-tramite')
      .then(({ data }) => {
        const filtrados = data.filter(t =>
          keywords.some(k => norm(t.nombre).includes(norm(k)))
        )
        const unicos = Array.from(new Map(filtrados.map(t => [norm(t.nombre), t])).values())
        setTipos(unicos)
        if (filtrados.length === 1) setTipoTramiteId(String(filtrados[0].id))
      })
      .catch(() => setError('No se pudieron cargar los tipos de trámite'))
      .finally(() => setLoadingTipos(false))
  }, [keywords])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await tramitesService.crearLicencia({
        tipoTramiteId: Number(tipoTramiteId),
        ...(referencia ? { referencia } : {}),
      })
      navigate(`${detallePath}/${data.solicitud.id}`)
    } catch (err) {
      setError(err.response?.data?.error ?? err.response?.data?.mensaje ?? 'Error al crear la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => navigate(backPath)}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} />
        Volver al listado
      </button>

      <h1 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">{titulo}</h1>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {loadingTipos ? (
          <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de trámite
              </label>
              {tipos.length === 0 ? (
                <p className="text-sm text-gray-400">No hay tipos disponibles para este módulo.</p>
              ) : (
                <select
                  value={tipoTramiteId}
                  onChange={e => setTipoTramiteId(e.target.value)}
                  required
                  className={INPUT}
                >
                  <option value="">Selecciona un tipo...</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              )}
            </div>

            {refLabel && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {refLabel}
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={e => setReferencia(e.target.value)}
                  required={refRequired}
                  placeholder={refPlaceholder ?? ''}
                  className={INPUT}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(backPath)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || tipos.length === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 dark:hover:bg-blue-500"
              >
                {loading ? <><Spinner size="sm" className="text-white" /><span>Enviando...</span></> : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
