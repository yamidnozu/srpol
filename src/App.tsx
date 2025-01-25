import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PublicLayout from "./components/layout/PublicLayout";
import ErrorBoundary from "./components/ui/ErrorBoundry";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import GestionMenu from "./pages/GestionMenu";
import GestionUsuarios from "./pages/GestionUsuarios";
import Login from "./pages/Login";

import GroupOrderPage from "./components/menu/GroupOrderPage";
import PedidosPage from "./pages/PedidosPage";
import Perfil from "./pages/Perfil";
import Success from "./pages/Success";
import "./styles/global.css";

const PrivateRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole || "client")) {
    return <Navigate to="/" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return !user ? <PublicLayout>{children}</PublicLayout> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <ErrorBoundary>
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
                path="/menu"
                element={
                  <PrivateRoute>
                    <GroupOrderPage />
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
                  <PrivateRoute allowedRoles={["admin", "encargado"]}>
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
                  <PrivateRoute allowedRoles={["admin"]}>
                    <GestionUsuarios />
                  </PrivateRoute>
                }
              />
              {/* Ruta para manejar pagos exitosos */}
              <Route
                path="/success"
                element={
                  <PrivateRoute>
                    <Success />
                  </PrivateRoute>
                }
              />
              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
