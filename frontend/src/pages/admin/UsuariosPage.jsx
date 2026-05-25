import { useEffect, useState } from 'react'
import api from '../../services/api'
import Spinner from '../../components/ui/Spinner'
import { AlertCircle, Shield, UserCheck, UserX } from 'lucide-react'

const ROLES = ['CIUDADANO', 'OPERADOR', 'SUPERVISOR', 'ADMIN']

const ROL_BADGE = {
  CIUDADANO:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPERADOR:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  SUPERVISOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  ADMIN:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const SELECT = 'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    api.get('/usuarios')
      .then(({ data }) => setUsuarios(data))
      .catch(() => setError('No se pudieron cargar los usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const cambiarRol = async (id, rol) => {
    setSaving(id + 'rol')
    try {
      const { data } = await api.patch(`/usuarios/${id}/rol`, { rol })
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: data.usuario.rol } : u))
    } catch (err) {
      alert(err.response?.data?.error ?? 'Error al cambiar rol')
    } finally {
      setSaving(null)
    }
  }

  const cambiarEstado = async (id, activo) => {
    setSaving(id + 'estado')
    try {
      const { data } = await api.patch(`/usuarios/${id}/estado`, { activo })
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: data.usuario.activo } : u))
    } catch (err) {
      alert(err.response?.data?.error ?? 'Error al cambiar estado')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="flex flex-1 items-center justify-center py-24"><Spinner size="lg" className="text-blue-600 dark:text-blue-400" /></div>

  if (error) return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
    </div>
  )

  return (
    <div className="animate-fade-in-up space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{usuarios.length} usuarios registrados</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">DPI</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {usuarios.map((u, i) => (
              <tr key={u.id} className="animate-fade-in hover:bg-gray-50/70 dark:hover:bg-gray-800/40" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{u.nombre}</p>
                  <p className="text-xs text-gray-400">{u.correo}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{u.dpi}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROL_BADGE[u.rol]}`}>
                      <Shield size={10} />{u.rol}
                    </span>
                    <select
                      value={u.rol}
                      onChange={e => cambiarRol(u.id, e.target.value)}
                      disabled={saving === u.id + 'rol'}
                      className={SELECT}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => cambiarEstado(u.id, !u.activo)}
                    disabled={saving === u.id + 'estado'}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      u.activo
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}
                  >
                    {u.activo ? <><UserCheck size={11} /> Activo</> : <><UserX size={11} /> Inactivo</>}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(u.creadoEn).toLocaleDateString('es-GT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
