// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/authForm.css' // Importa el archivo CSS específico para los formularios de autenticación

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { register } = useAuth()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await register(email, password)
    } catch (err) {
      setError((err as { message: string }).message)
      setTimeout(() => setError(null), 5000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      <button type="submit" className="auth-button">
        Registrarse
      </button>
    </form>
  )
}

export default RegisterForm
