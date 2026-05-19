import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { AlertCircle, ArrowLeft } from 'lucide-react'

const INPUT = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500'

export default function NuevaMultaAdminPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ ciudadanoDpi: '', referencia: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/tramites/multa-ciudadano', {
        ciudadanoDpi: form.ciudadanoDpi.trim(),
        referencia: form.referencia || undefined,
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              DPI del ciudadano
            </label>
            <input
              type="text"
              name="ciudadanoDpi"
              value={form.ciudadanoDpi}
              onChange={handleChange}
              required
              maxLength={13}
              placeholder="Número de DPI (13 dígitos)"
              className={INPUT}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción / Motivo de la multa
            </label>
            <textarea
              name="referencia"
              value={form.referencia}
              onChange={handleChange}
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
