import { Home } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['residencia']

export default function ResidenciaListPage() {
  return (
    <ModuloListPage
      titulo="Constancias de Residencia"
      keywords={KEYWORDS}
      nuevoPath="/residencia/nueva"
      detallePath="/residencia"
      accentColor="indigo"
      IconoVacio={Home}
    />
  )
}
