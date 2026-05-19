import { AlertTriangle } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['multa']

export default function MultasListPage() {
  return (
    <ModuloListPage
      titulo="Pago de Multas"
      keywords={KEYWORDS}
      nuevoPath="/multas/nuevo"
      nuevoPathAdmin="/multas/nueva-admin"
      labelAdmin="Registrar multa"
      detallePath="/multas"
      accentColor="red"
      IconoVacio={AlertTriangle}
    />
  )
}
