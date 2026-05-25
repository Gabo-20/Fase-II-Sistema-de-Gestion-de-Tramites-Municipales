import NuevoTramitePage from '../../components/tramites/NuevoTramitePage'

export default function NuevaMultaPage() {
  return (
    <NuevoTramitePage
      titulo="Nueva Solicitud de Pago de Multa"
      keywords={['multa']}
      backPath="/multas"
      detallePath="/multas"
    />
  )
}
