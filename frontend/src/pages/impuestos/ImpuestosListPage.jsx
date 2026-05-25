import { Receipt } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['iusi', 'impuesto']

export default function ImpuestosListPage() {
  return (
    <ModuloListPage
      titulo="Pagos de IUSI"
      keywords={KEYWORDS}
      nuevoPath="/impuestos/nuevo"
      detallePath="/impuestos"
      accentColor="orange"
      IconoVacio={Receipt}
    />
  )
}
