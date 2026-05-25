import { BadgeCheck } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['solvencia']

export default function SolvenciaListPage() {
  return (
    <ModuloListPage
      titulo="Certificados de Solvencia"
      keywords={KEYWORDS}
      nuevoPath="/solvencia/nueva"
      detallePath="/solvencia"
      accentColor="teal"
      IconoVacio={BadgeCheck}
    />
  )
}
