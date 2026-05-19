import NuevoTramitePage from '../../components/tramites/NuevoTramitePage'

export default function NuevaSolvenciaPage() {
  return (
    <NuevoTramitePage
      titulo="Nueva Solicitud de Solvencia"
      keywords={['solvencia']}
      backPath="/solvencia"
      detallePath="/solvencia"
      refLabel="Motivo de la solicitud"
      refPlaceholder="Ej. Trámite bancario, venta de inmueble..."
    />
  )
}
