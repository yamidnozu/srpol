// src/App.tsx
import React from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import PublicLayout from './components/layout/PublicLayout'
import GroupOrderPage from './components/menu/GroupOrderPage'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import ContabilidadDetail from './pages/ContabilidadDetail'
import ContabilidadPage from './pages/ContabilidadPage'
import Dashboard from './pages/Dashboard'
import GestionMenu from './pages/GestionMenu'
import GestionUsuarios from './pages/GestionUsuarios'
import Login from './pages/Login'
import MenuPage from './pages/MenuPage'
import PedidosPage from './pages/PedidosPage'
import Perfil from './pages/Perfil'
import Success from './pages/Success'

// Componente para manejar el layout dinámicamente según autenticación
const DynamicLayoutRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  return user ? <MainLayout>{children}</MainLayout> : <PublicLayout>{children}</PublicLayout>
}

// Ruta pública: solo accesible para usuarios no autenticados
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  return !user ? <PublicLayout>{children}</PublicLayout> : <Navigate to="/" />
}

// Ruta privada: solo accesible para usuarios autenticados con roles permitidos
const PrivateRoute: React.FC<{
  children: React.ReactNode
  allowedRoles?: string[]
}> = ({ children, allowedRoles }) => {
  const { user, loading, userRole } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(userRole || 'client')) {
    return <Navigate to="/" />
  }

  return <MainLayout>{children}</MainLayout>
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Ruta pública: solo para no autenticados */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Rutas con layout dinámico: accesibles para ambos, con o sin autenticación */}
            <Route
              path="/menu"
              element={
                <DynamicLayoutRoute>
                  <MenuPage />
                </DynamicLayoutRoute>
              }
            />
            <Route
              path="/menu/:groupOrderId"
              element={
                <DynamicLayoutRoute>
                  <GroupOrderPage />
                </DynamicLayoutRoute>
              }
            />

            {/* Rutas privadas: solo para autenticados */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/success"
              element={
                <PrivateRoute>
                  <Success />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <PrivateRoute>
                  <PedidosPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/gestion-menu"
              element={
                <PrivateRoute allowedRoles={['admin', 'encargado']}>
                  <GestionMenu />
                </PrivateRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <PrivateRoute>
                  <Perfil />
                </PrivateRoute>
              }
            />
            <Route
              path="/gestion-usuarios"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <GestionUsuarios />
                </PrivateRoute>
              }
            />
            <Route
              path="/contabilidad"
              element={
                <PrivateRoute allowedRoles={['admin', 'encargado']}>
                  <ContabilidadPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/contabilidad/:id"
              element={
                <PrivateRoute allowedRoles={['admin', 'encargado']}>
                  <ContabilidadDetail />
                </PrivateRoute>
              }
            />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
