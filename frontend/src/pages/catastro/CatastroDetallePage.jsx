import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { catastroService } from '../../services/catastroService'
import api from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { ArrowLeft, Map, User, Clock, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{value ?? '—'}</dd>
    </div>
  )
}

export default function CatastroDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inmueble, setInmueble] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ propietarioNuevo: '', motivo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modo, setModo] = useState('manual') // 'manual' | 'sistema'
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  const cargar = () => {
    catastroService.getInmuebleById(id)
      .then(({ data }) => setInmueble(data))
      .catch(() => navigate('/catastro'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const cargarUsuarios = () => {
    if (usuarios.length > 0) return
    setLoadingUsuarios(true)
    api.get('/usuarios')
      .then(({ data }) => setUsuarios(data.usuarios ?? data))
      .catch(() => {})
      .finally(() => setLoadingUsuarios(false))
  }

  const handleModoChange = (nuevoModo) => {
    setModo(nuevoModo)
    setForm({ propietarioNuevo: '', motivo: '' })
    if (nuevoModo === 'sistema') cargarUsuarios()
  }

  const handleActualizar = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')
    setSaving(true)
    try {
      await catastroService.actualizarPropietario(id, form)
      setForm({ propietarioNuevo: '', motivo: '' })
      setExito('Propietario actualizado correctamente')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error ?? err.response?.data?.mensaje ?? 'Error al actualizar el propietario')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n) =>
    n != null
      ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-amber-600 dark:text-amber-400" />
      </div>
    )
  }
  if (!inmueble) return null

  return (
    <div className="animate-fade-in-up space-y-5">
      <button
        onClick={() => navigate('/catastro')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
      >
        <ArrowLeft size={15} />
        Volver al catastro
      </button>

      {/* Datos del inmueble */}
      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <Map size={18} className="text-amber-600 dark:text-amber-400" />
          <h1 className="font-bold text-gray-900 dark:text-white">{inmueble.numeroCatastral}</h1>
        </div>

        <div className="space-y-6 p-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoField label="Número catastral" value={inmueble.numeroCatastral} />
            <InfoField label="Propietario actual" value={inmueble.propietario} />
            <InfoField label="Dirección" value={inmueble.direccion} />
            <InfoField label="Área" value={`${fmt(inmueble.area)} m²`} />
            <InfoField label="Valor catastral" value={`Q ${fmt(inmueble.valorCatastral)}`} />
          </dl>

          {/* Historial de propietarios */}
          {inmueble.historialPropietarios?.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Clock size={14} /> Historial de propietarios
              </h2>
              <ol className="space-y-2">
                {inmueble.historialPropietarios.map((h, i) => (
                  <li
                    key={h.id ?? i}
                    className="animate-slide-in-left rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <User size={13} className="text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{h.propietarioAnterior}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">{h.propietarioNuevo}</span>
                    </div>
                    {h.motivo && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{h.motivo}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {new Date(h.fecha ?? h.creadoEn).toLocaleDateString('es-GT', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Formulario actualizar propietario */}
          <form onSubmit={handleActualizar} className="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <User size={14} /> Actualizar propietario
              </h2>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => handleModoChange('manual')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${modo === 'manual' ? 'bg-white shadow-sm text-gray-800 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => handleModoChange('sistema')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${modo === 'sistema' ? 'bg-white shadow-sm text-gray-800 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  Del sistema
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo propietario</label>
              {modo === 'manual' ? (
                <input
                  type="text"
                  value={form.propietarioNuevo}
                  onChange={(e) => setForm({ ...form, propietarioNuevo: e.target.value })}
                  required
                  className={INPUT}
                  placeholder="Nombre completo del nuevo propietario"
                />
              ) : (
                <div className="relative">
                  {loadingUsuarios ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                      <Spinner size="sm" className="text-gray-400" />
                      <span className="text-sm text-gray-400">Cargando usuarios...</span>
                    </div>
                  ) : (
                    <select
                      value={form.propietarioNuevo}
                      onChange={(e) => setForm({ ...form, propietarioNuevo: e.target.value })}
                      required
                      className={INPUT}
                    >
                      <option value="">Seleccionar usuario del sistema...</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.nombre}>{u.nombre} — {u.correo}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Motivo <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                rows={2}
                className={INPUT}
                placeholder="Compraventa, herencia, donación..."
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {exito && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                {exito}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {saving
                ? <><Spinner size="sm" className="text-white" /><span>Guardando...</span></>
                : 'Actualizar propietario'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
