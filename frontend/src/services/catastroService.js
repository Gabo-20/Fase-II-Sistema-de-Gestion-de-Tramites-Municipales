import api from './api'

export const catastroService = {
  getInmuebles:        (busqueda = '') => api.get('/catastro', { params: busqueda ? { busqueda } : {} }),
  getInmuebleById:     (id)            => api.get(`/catastro/${id}`),
  crearInmueble:       (data)          => api.post('/catastro', data),
  actualizarPropietario: (id, data)    => api.patch(`/catastro/${id}/propietario`, data),
}
