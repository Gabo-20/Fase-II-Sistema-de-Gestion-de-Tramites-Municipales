import { CalendarClock } from 'lucide-react'
import ModuloListPage from '../../components/tramites/ModuloListPage'

const KEYWORDS = ['temporal', 'licencia temporal']

export default function LicenciasTemporalesListPage() {
  return (
    <ModuloListPage
      titulo="Licencias Temporales"
      keywords={KEYWORDS}
      nuevoPath="/licencias-temporales/nueva"
      detallePath="/licencias-temporales"
      accentColor="violet"
      IconoVacio={CalendarClock}
    />
  )
}
