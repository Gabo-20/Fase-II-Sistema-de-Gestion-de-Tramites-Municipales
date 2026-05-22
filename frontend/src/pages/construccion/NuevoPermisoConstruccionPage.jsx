import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { tramitesService } from '../../services/tramitesService'
import Spinner from '../../components/ui/Spinner'
import { AlertCircle, ArrowLeft, MapPin } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

const norm = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const KEYWORDS = ['construccion', 'permiso de construccion']

export default function NuevoPermisoConstruccionPage() {
  const navigate = useNavigate()
  const [tipos, setTipos] = useState([])
  const [form, setForm] = useState({ tipoTramiteId: '', direccion: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(true)

  useEffect(() => {
    api.get('/tipos-tramite')
      .then(({ data }) => {
        const filtrados = data.filter(t => KEYWORDS.some(k => norm(t.nombre).includes(k)))
        setTipos(filtrados)
        if (filtrados.length === 1) setForm(f => ({ ...f, tipoTramiteId: String(filtrados[0].id) }))
      })
      .catch(() => setError('No se pudieron cargar los tipos de trámite'))
      .finally(() => setLoadingTipos(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await tramitesService.crearLicencia({
        tipoTramiteId: Number(form.tipoTramiteId),
        referencia: form.direccion || undefined,
      })
      navigate(`/construccion/${data.solicitud.id}`)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al crear el permiso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => navigate('/construccion')}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} />
        Volver al listado
      </button>

      <h1 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">Nuevo Permiso de Construcción</h1>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {loadingTipos ? (
          <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de permiso</label>
              {tipos.length === 0 ? (
                <p className="text-sm text-gray-400">No hay tipos disponibles.</p>
              ) : (
                <select name="tipoTramiteId" value={form.tipoTramiteId} onChange={handleChange} required className={INPUT}>
                  <option value="">Selecciona un tipo...</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección del inmueble</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                  placeholder="Zona, colonia, dirección exacta..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/construccion')}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || tipos.length === 0}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
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
