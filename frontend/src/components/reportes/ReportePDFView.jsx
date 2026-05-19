import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  PieChart, Pie,
} from 'recharts'

const ESTADO_COLOR = {
  RECIBIDA:    '#6b7280',
  EN_REVISION: '#f59e0b',
  APROBADA:    '#10b981',
  RECHAZADA:   '#ef4444',
  SUBSANACION: '#f97316',
}
const ESTADO_LABEL = {
  RECIBIDA: 'Recibida', EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', SUBSANACION: 'Subsanación',
}
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#f97316','#06b6d4','#84cc16']

const fmt = d => d ? new Date(d).toLocaleDateString('es-GT', { day:'2-digit', month:'short', year:'numeric' }) : '—'

export default function ReportePDFView({ solicitudes = [], filtros = {} }) {
  const total      = solicitudes.length
  const aprobadas  = solicitudes.filter(s => s.estado === 'APROBADA').length
  const revision   = solicitudes.filter(s => s.estado === 'EN_REVISION').length
  const rechazadas = solicitudes.filter(s => s.estado === 'RECHAZADA').length
  const recibidas  = solicitudes.filter(s => s.estado === 'RECIBIDA').length

  // Datos para gráfica de barras (estados)
  const barData = Object.entries(ESTADO_LABEL)
    .map(([key, label]) => ({ name: label, value: solicitudes.filter(s => s.estado === key).length, color: ESTADO_COLOR[key] }))
    .filter(d => d.value > 0)

  // Datos para gráfica de pastel (tipos)
  const tipoMap = {}
  solicitudes.forEach(s => {
    const nombre = s.tipoTramite?.nombre ?? 'Sin tipo'
    tipoMap[nombre] = (tipoMap[nombre] ?? 0) + 1
  })
  const tiposSorted = Object.entries(tipoMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const TOP = 6
  const pieData = tiposSorted.length <= TOP
    ? tiposSorted
    : [
        ...tiposSorted.slice(0, TOP),
        { name: 'Otros', value: tiposSorted.slice(TOP).reduce((s, t) => s + t.value, 0) },
      ]

  const desde = filtros.desde ? new Date(filtros.desde + 'T00:00:00').toLocaleDateString('es-GT', { day:'2-digit', month:'long', year:'numeric' }) : '—'
  const hasta = filtros.hasta ? new Date(filtros.hasta + 'T00:00:00').toLocaleDateString('es-GT', { day:'2-digit', month:'long', year:'numeric' }) : '—'
  const ahora = new Date().toLocaleString('es-GT', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <div style={{ width: 794, fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111827' }}>

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <div style={{ background: '#1e3a8a', padding: '28px 36px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7l9-4 9 4v14M9 21V12h6v9" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#bfdbfe', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Municipalidad</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Sistema de Trámites Municipales</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#bfdbfe', fontSize: 11, marginBottom: 2 }}>Generado el</div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{ahora}</div>
        </div>
      </div>

      {/* ── Título y período ─────────────────────────────────────────── */}
      <div style={{ background: '#eff6ff', padding: '16px 36px', borderBottom: '2px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>Reporte de Solicitudes</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {filtros.estado ? `Estado: ${ESTADO_LABEL[filtros.estado] ?? filtros.estado}` : 'Todos los estados'}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>PERÍODO</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a' }}>{desde} — {hasta}</div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>

        {/* ── KPI Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Total',       value: total,      bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e' },
            { label: 'Recibidas',   value: recibidas,  bg: '#f9fafb', border: '#d1d5db', text: '#374151' },
            { label: 'En revisión', value: revision,   bg: '#fffbeb', border: '#fde68a', text: '#78350f' },
            { label: 'Aprobadas',   value: aprobadas,  bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
            { label: 'Rechazadas',  value: rechazadas, bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.text }}>{c.value}</div>
              <div style={{ fontSize: 10, color: c.text, opacity: 0.8, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Gráficas ─────────────────────────────────────────────────── */}
        {total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

            {/* Barras por estado */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Solicitudes por estado</div>
              <BarChart width={320} height={200} data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 9, fill: '#374151' }}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </div>

            {/* Pastel por tipo — pie + tabla de leyenda */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Solicitudes por tipo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <PieChart width={160} height={160}>
                    <Pie
                      data={pieData} dataKey="value"
                      cx="50%" cy="50%"
                      outerRadius={68}
                      startAngle={90} endAngle={-270}
                      isAnimationActive={false}
                      labelLine={false}
                      stroke="#f9fafb"
                      strokeWidth={2}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </div>
                {/* Leyenda manual como tabla */}
                <div style={{ flex: 1, overflowY: 'hidden' }}>
                  {pieData.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <div style={{ fontSize: 8.5, color: '#374151', flex: 1, lineHeight: 1.2 }}>{entry.name}</div>
                      <div style={{ fontSize: 8.5, fontWeight: 700, color: '#1e3a8a', flexShrink: 0 }}>{entry.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabla ────────────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#3b82f6', borderRadius: 2 }} />
            Detalle de solicitudes ({total})
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: '#1e3a8a' }}>
                {['Expediente','Tipo de trámite','Ciudadano','Estado','Funcionario','Fecha'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'left', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 9, color: '#374151', fontWeight: 600 }}>{s.numeroExpediente}</td>
                  <td style={{ padding: '6px 10px', color: '#374151' }}>{s.tipoTramite?.nombre ?? '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#374151' }}>
                    <div>{s.ciudadano?.nombre ?? '—'}</div>
                    <div style={{ color: '#9ca3af', fontSize: 8 }}>{s.ciudadano?.correo ?? ''}</div>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <span style={{
                      background: ESTADO_COLOR[s.estado] + '22',
                      color: ESTADO_COLOR[s.estado],
                      padding: '2px 7px', borderRadius: 99, fontSize: 8, fontWeight: 600
                    }}>
                      {ESTADO_LABEL[s.estado] ?? s.estado}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', color: '#6b7280' }}>{s.funcionario?.nombre ?? '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#6b7280' }}>{fmt(s.fechaSolicitud)}</td>
                </tr>
              ))}
              {solicitudes.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sin solicitudes para los filtros aplicados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pie de página ────────────────────────────────────────────── */}
        <div data-pdf-avoid-break style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 9, color: '#9ca3af' }}>
            Sistema de Gestión de Trámites Municipales<br />
            Documento generado automáticamente — {ahora}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 160, borderTop: '1px solid #374151', paddingTop: 4 }}>
              <div style={{ fontSize: 9, color: '#374151' }}>Firma autorizada</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
