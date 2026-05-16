import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ui/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'
import AuthLayout from '../components/layout/AuthLayout'

import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'

import LicenciasListPage from '../pages/licencias/LicenciasListPage'
import NuevaLicenciaPage from '../pages/licencias/NuevaLicenciaPage'
import LicenciaDetallePage from '../pages/licencias/LicenciaDetallePage'

import ConstruccionListPage from '../pages/construccion/ConstruccionListPage'
import NuevoPermisoConstruccionPage from '../pages/construccion/NuevoPermisoConstruccionPage'
import PermisoConstruccionDetallePage from '../pages/construccion/PermisoConstruccionDetallePage'

import ImpuestosListPage from '../pages/impuestos/ImpuestosListPage'
import NuevoImpuestoPage from '../pages/impuestos/NuevoImpuestoPage'
import ImpuestoDetallePage from '../pages/impuestos/ImpuestoDetallePage'

import SolvenciaListPage from '../pages/solvencia/SolvenciaListPage'
import NuevaSolvenciaPage from '../pages/solvencia/NuevaSolvenciaPage'
import SolvenciaDetallePage from '../pages/solvencia/SolvenciaDetallePage'

import MultasListPage from '../pages/multas/MultasListPage'
import NuevaMultaPage from '../pages/multas/NuevaMultaPage'
import MultaDetallePage from '../pages/multas/MultaDetallePage'

import ResidenciaListPage from '../pages/residencia/ResidenciaListPage'
import NuevaResidenciaPage from '../pages/residencia/NuevaResidenciaPage'
import ResidenciaDetallePage from '../pages/residencia/ResidenciaDetallePage'

import RotuloListPage from '../pages/rotulo/RotuloListPage'
import NuevoRotuloPage from '../pages/rotulo/NuevoRotuloPage'
import RotuloDetallePage from '../pages/rotulo/RotuloDetallePage'

import LicenciasTemporalesListPage from '../pages/licencias-temporales/LicenciasTemporalesListPage'
import NuevaLicenciaTemporalPage from '../pages/licencias-temporales/NuevaLicenciaTemporalPage'
import LicenciaTemporalDetallePage from '../pages/licencias-temporales/LicenciaTemporalDetallePage'

import CatastroPage from '../pages/catastro/CatastroPage'
import CatastroDetallePage from '../pages/catastro/CatastroDetallePage'
import ReportesPage from '../pages/reportes/ReportesPage'
import HistorialPage from '../pages/historial/HistorialPage'
import NotificacionesPage from '../pages/notificaciones/NotificacionesPage'
import UsuariosPage from '../pages/admin/UsuariosPage'

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/registro', element: <RegisterPage /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },

          { path: '/licencias', element: <LicenciasListPage /> },
          { path: '/licencias/:id', element: <LicenciaDetallePage /> },

          { path: '/construccion', element: <ConstruccionListPage /> },
          { path: '/construccion/:id', element: <PermisoConstruccionDetallePage /> },

          { path: '/impuestos', element: <ImpuestosListPage /> },
          { path: '/impuestos/:id', element: <ImpuestoDetallePage /> },

          { path: '/solvencia', element: <SolvenciaListPage /> },
          { path: '/solvencia/:id', element: <SolvenciaDetallePage /> },

          { path: '/multas', element: <MultasListPage /> },
          { path: '/multas/:id', element: <MultaDetallePage /> },

          { path: '/residencia', element: <ResidenciaListPage /> },
          { path: '/residencia/:id', element: <ResidenciaDetallePage /> },

          { path: '/rotulo', element: <RotuloListPage /> },
          { path: '/rotulo/:id', element: <RotuloDetallePage /> },

          { path: '/licencias-temporales', element: <LicenciasTemporalesListPage /> },
          { path: '/licencias-temporales/:id', element: <LicenciaTemporalDetallePage /> },

          { path: '/notificaciones', element: <NotificacionesPage /> },

          // Solo ciudadanos
          {
            element: <ProtectedRoute roles={['CIUDADANO']} />,
            children: [
              { path: '/historial', element: <HistorialPage /> },
            ],
          },

          // Solo ciudadanos pueden crear nuevas solicitudes
          {
            element: <ProtectedRoute roles={['CIUDADANO']} />,
            children: [
              { path: '/licencias/nueva', element: <NuevaLicenciaPage /> },
              { path: '/construccion/nuevo', element: <NuevoPermisoConstruccionPage /> },
              { path: '/impuestos/nuevo', element: <NuevoImpuestoPage /> },
              { path: '/solvencia/nueva', element: <NuevaSolvenciaPage /> },
              { path: '/multas/nuevo', element: <NuevaMultaPage /> },
              { path: '/residencia/nueva', element: <NuevaResidenciaPage /> },
              { path: '/rotulo/nuevo', element: <NuevoRotuloPage /> },
              { path: '/licencias-temporales/nueva', element: <NuevaLicenciaTemporalPage /> },
            ],
          },

          // Operador+
          {
            element: <ProtectedRoute roles={['OPERADOR', 'SUPERVISOR', 'ADMIN']} />,
            children: [
              { path: '/catastro', element: <CatastroPage /> },
              { path: '/catastro/:id', element: <CatastroDetallePage /> },
              { path: '/reportes', element: <ReportesPage /> },
            ],
          },

          // Solo Admin
          {
            element: <ProtectedRoute roles={['ADMIN']} />,
            children: [
              { path: '/admin/usuarios', element: <UsuariosPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <LoginPage /> },
])

export default router
