import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { catastroService } from '../../services/catastroService'
import Spinner from '../../components/ui/Spinner'
import { Search, Plus, Map, ArrowRight, X, AlertCircle } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500'
const LABEL = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

function NuevoInmuebleModal({ onClose, onCreado }) {
  const [form, setForm] = useState({ numeroCatastral: '', direccion: '', propietario: '', area: '', valorCatastral: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await catastroService.crearInmueble({
        ...form,
        area: Number(form.area),
        valorCatastral: Number(form.valorCatastral),
      })
      onCreado()
    } catch (err) {
      setError(err.response?.data?.error ?? err.response?.data?.mensaje ?? 'Error al crear el inmueble')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-in-up relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Nuevo inmueble</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Número catastral</label>
              <input name="numeroCatastral" value={form.numeroCatastral} onChange={handleChange} required className={INPUT} placeholder="CAT-2026-001" />
            </div>
            <div>
              <label className={LABEL}>Propietario</label>
              <input name="propietario" value={form.propietario} onChange={handleChange} required className={INPUT} placeholder="Nombre completo" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} required className={INPUT} placeholder="Zona, colonia, dirección exacta..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Área (m²)</label>
              <input type="number" name="area" value={form.area} onChange={handleChange} required min="0" step="0.01" className={INPUT} placeholder="150.00" />
            </div>
            <div>
              <label className={LABEL}>Valor catastral (Q)</label>
              <input type="number" name="valorCatastral" value={form.valorCatastral} onChange={handleChange} required min="0" step="0.01" className={INPUT} placeholder="500000" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
              {loading ? <><Spinner size="sm" className="text-white" /><span>Guardando...</span></> : 'Crear inmueble'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CatastroPage() {
  const [inmuebles, setInmuebles] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const cargar = useCallback(async (texto = '') => {
    setLoading(true)
    setError('')
    try {
      const { data } = await catastroService.getInmuebles(texto)
      setInmuebles(data.inmuebles ?? data)
    } catch {
      setError('No se pudieron cargar los inmuebles')
    } finally {
      setLoading(false)
    }
  }, [])

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 350)
    return () => clearTimeout(t)
  }, [busqueda, cargar])

  const fmt = (n) =>
    n != null
      ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—'

  return (
    <>
      {modalOpen && (
        <NuevoInmuebleModal
          onClose={() => setModalOpen(false)}
          onCreado={() => { setModalOpen(false); cargar(busqueda) }}
        />
      )}

      <div className="animate-fade-in-up space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Catastro Municipal</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Cargando...' : `${inmuebles.length} inmueble${inmuebles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            <Plus size={16} /> Nuevo inmueble
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número catastral, dirección o propietario..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={14} />
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-amber-600 dark:text-amber-400" />
          </div>
        ) : inmuebles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
            <Map className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay inmuebles registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">N° Catastral</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="hidden px-4 py-3 md:table-cell">Propietario</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Área (m²)</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Valor catastral</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {inmuebles.map((m, i) => (
                  <tr
                    key={m.id}
                    className="animate-fade-in hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{m.numeroCatastral}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{m.direccion}</td>
                    <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-400 md:table-cell">{m.propietario}</td>
                    <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-500 lg:table-cell">{fmt(m.area)}</td>
                    <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-500 lg:table-cell">Q {fmt(m.valorCatastral)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/catastro/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                      >
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
    </>
  )
}
