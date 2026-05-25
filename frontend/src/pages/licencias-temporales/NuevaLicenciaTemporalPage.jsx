import NuevoTramitePage from '../../components/tramites/NuevoTramitePage'

export default function NuevaLicenciaTemporalPage() {
  return (
    <NuevoTramitePage
      titulo="Nueva Licencia Temporal"
      keywords={['temporal', 'licencia temporal']}
      backPath="/licencias-temporales"
      detallePath="/licencias-temporales"
    />
  )
}
