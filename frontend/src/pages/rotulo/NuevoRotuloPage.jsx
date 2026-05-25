import NuevoTramitePage from '../../components/tramites/NuevoTramitePage'

export default function NuevoRotuloPage() {
  return (
    <NuevoTramitePage
      titulo="Nueva Solicitud de Permiso de Rótulo"
      keywords={['rótulo', 'rotulo']}
      backPath="/rotulo"
      detallePath="/rotulo"
    />
  )
}
