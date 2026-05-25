import NuevoTramitePage from '../../components/tramites/NuevoTramitePage'

export default function NuevaResidenciaPage() {
  return (
    <NuevoTramitePage
      titulo="Nueva Constancia de Residencia"
      keywords={['residencia']}
      backPath="/residencia"
      detallePath="/residencia"
      refLabel="Dirección exacta de residencia"
      refPlaceholder="Zona, colonia, calle, número de casa..."
      refRequired
    />
  )
}
