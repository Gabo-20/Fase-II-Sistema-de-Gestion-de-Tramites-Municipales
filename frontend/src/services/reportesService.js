import api from './api'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export const reportesService = {
  getSolicitudes:  (params) => api.get('/reportes/solicitudes', { params }),
  getHistorial:    (ciudadanoId) => api.get(`/reportes/historial/${ciudadanoId}`),
  getTiposTramite: () => api.get('/tipos-tramite'),
  exportUrl:       (params) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString()
    return `${BASE}/reportes/solicitudes/export${qs ? `?${qs}` : ''}`
  },
}
