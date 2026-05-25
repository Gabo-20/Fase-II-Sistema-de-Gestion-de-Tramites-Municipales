import { Tag } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['rótulo', 'rotulo']

export default function RotuloListPage() {
  return (
    <ModuloListPage
      titulo="Permisos de Rótulo"
      keywords={KEYWORDS}
      nuevoPath="/rotulo/nuevo"
      detallePath="/rotulo"
      accentColor="pink"
      IconoVacio={Tag}
    />
  )
}
