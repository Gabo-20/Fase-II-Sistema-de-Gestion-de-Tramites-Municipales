import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { AlertCircle, ArrowLeft, Search } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

export default function NuevaMultaAdminPage() {
  const navigate = useNavigate()
  const [ciudadanos, setCiudadanos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState(null)
  const [usarDpiManual, setUsarDpiManual] = useState(false)
  const [dpiManual, setDpiManual] = useState('')
  const [referencia, setReferencia] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCiudadanos, setLoadingCiudadanos] = useState(true)

  useEffect(() => {
    api.get('/usuarios/ciudadanos')
      .then(({ data }) => setCiudadanos(data))
      .catch(() => setUsarDpiManual(true))
      .finally(() => setLoadingCiudadanos(false))
  }, [])

  const filtrados = busqueda.trim()
    ? ciudadanos.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.dpi.includes(busqueda) ||
        c.correo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : ciudadanos

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const dpi = usarDpiManual ? dpiManual.trim() : ciudadanoSeleccionado?.dpi
    if (!dpi) {
      setError('Selecciona o ingresa el DPI del ciudadano')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/tramites/multa-ciudadano', {
        ciudadanoDpi: dpi,
        referencia: referencia || undefined,
      })
      navigate(`/multas/${data.solicitud.id}`)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al registrar la multa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => navigate('/multas')}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} />
        Volver al listado
      </button>

      <h1 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">Registrar Multa a Ciudadano</h1>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Selector de ciudadano */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciudadano</label>
              <button
                type="button"
                onClick={() => { setUsarDpiManual(!usarDpiManual); setCiudadanoSeleccionado(null); setDpiManual('') }}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {usarDpiManual ? 'Buscar en el sistema' : 'Ingresar DPI manualmente'}
              </button>
            </div>

            {usarDpiManual ? (
              <input
                type="text"
                value={dpiManual}
                onChange={e => setDpiManual(e.target.value)}
                maxLength={13}
                placeholder="Número de DPI (13 dígitos)"
                className={INPUT}
              />
            ) : loadingCiudadanos ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size="sm" /> Cargando ciudadanos...</div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); setCiudadanoSeleccionado(null) }}
                    placeholder="Buscar por nombre, DPI o correo..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {ciudadanoSeleccionado ? (
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{ciudadanoSeleccionado.nombre}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">DPI: {ciudadanoSeleccionado.dpi} · {ciudadanoSeleccionado.correo}</p>
                    </div>
                    <button type="button" onClick={() => setCiudadanoSeleccionado(null)} className="text-xs text-blue-500 hover:underline">Cambiar</button>
                  </div>
                ) : busqueda.trim() ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {filtrados.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-400">Sin resultados</p>
                    ) : filtrados.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCiudadanoSeleccionado(c); setBusqueda('') }}
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.nombre}</p>
                        <p className="text-xs text-gray-400">DPI: {c.dpi} · {c.correo}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción / Motivo de la multa
            </label>
            <textarea
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              rows={3}
              placeholder="Infracción cometida, número de resolución, etc."
              className={INPUT}
            />
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
              onClick={() => navigate('/multas')}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? <><Spinner size="sm" className="text-white" /><span>Registrando...</span></> : 'Registrar multa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
