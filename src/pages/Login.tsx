// src/pages/Login.tsx
import React, { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'
import PublicLayout from '../components/layout/PublicLayout'
import '../styles/login.css' // Importa el archivo CSS específico para el login

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleChange = (newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <PublicLayout>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/SrPol.png" alt="Logo SrPol" className="login-logo" />
          </div>

          <div className="login-tabs">
            <button
              className={`login-tab ${tabValue === 0 ? 'active' : ''}`}
              onClick={() => handleChange(0)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`login-tab ${tabValue === 1 ? 'active' : ''}`}
              onClick={() => handleChange(1)}
            >
              Registrarse
            </button>
          </div>

          <div
            className={`login-form-container ${tabValue === 0 ? 'slide-in-left' : 'slide-in-right'}`}
          >
            {tabValue === 0 && <LoginForm />}
            {tabValue === 1 && <RegisterForm />}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default Login
