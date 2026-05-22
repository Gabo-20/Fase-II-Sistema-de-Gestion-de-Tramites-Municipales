import api from './api'

export const tramitesService = {
  // ── Implementado Sprint 1 ──────────────────────────────────────────────────
  // GET /api/tramites/   (CIUDADANO — sus propias solicitudes)
  getMisSolicitudes: () => api.get('/tramites/'),
  // GET /api/tramites/:id
  getSolicitudById: (id) => api.get(`/tramites/${id}`),
  // POST /api/tramites/  body: { tipoTramiteId }
  crearLicencia: (data) => api.post('/tramites/', data),

  // ── Pendiente Sprint 2 (backend aún no implementado) ──────────────────────
  renovarLicencia: (id, data) => api.put(`/tramites/${id}/renovar`, data),
  aprobarRechazarLicencia: (id, data) => api.patch(`/tramites/${id}/resolucion`, data),

  crearPermisoConstruccion: (data) => api.post('/tramites/', data),
  getEstadoPermiso: (id) => api.get(`/tramites/${id}`),
  agregarObservacion: (id, data) => api.post(`/tramites/${id}/observaciones`, data),

  registrarPago: (id) => api.post(`/tramites/${id}/pago`),

  getSolicitudesPendientes: () => api.get('/tramites/'),

  // ── Notificaciones ────────────────────────────────────────────────────────
  getNotificaciones: () => api.get('/notificaciones'),

  // ── Pendiente Sprint 3 ────────────────────────────────────────────────────
  actualizarPropietario: (id, data) => api.put(`/tramites/catastro/${id}/propietario`, data),
  solicitarDeslinde: (data) => api.post('/tramites/catastro/deslinde', data),
  actualizarValuacion: (id, data) => api.put(`/tramites/catastro/${id}/valuacion`, data),
}
