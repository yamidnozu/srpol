// src/App.tsx
import React, { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import PublicLayout from './components/layout/PublicLayout'
import GroupOrderPage from './components/menu/GroupOrderPage'
import SplashScreen from './components/splash/SplashScreen' // Importa el componente SplashScreen
import ErrorBoundary from './components/ui/ErrorBoundry'
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
import './styles/global.css'

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

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  return !user ? <PublicLayout>{children}</PublicLayout> : <Navigate to="/" />
}

const App: React.FC = () => {
  const [splashFinished, setSplashFinished] = useState(false)

  useEffect(() => {
    // Simula la finalización del splash screen después de un tiempo (ajusta este tiempo)
    const timeout = setTimeout(() => {
      setSplashFinished(true)
    }, 3000) // Debe coincidir con la duración total del splash screen (2.5s + 0.5s fade out)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <ErrorBoundary>
            {!splashFinished ? (
              <SplashScreen /> // Renderiza el SplashScreen mientras no haya terminado
            ) : (
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
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
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/menu/:groupOrderId"
                  element={
                    <PrivateRoute>
                      <GroupOrderPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <PrivateRoute>
                      <MenuPage />
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
                  path="/success"
                  element={
                    <PrivateRoute>
                      <Success />
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
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            )}
          </ErrorBoundary>
        </Router>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
