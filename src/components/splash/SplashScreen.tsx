// src/components/splash/SplashScreen.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Importa el logo como una URL

import { useAuth } from '../../hooks/useAuth'
import './../../styles/SplashScreen.css' // Importa el archivo CSS de estilos

const SplashScreen: React.FC = () => {
  const [logoAnimation, setLogoAnimation] = useState(false)
  const [textAnimation, setTextAnimation] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Inicia la animación del logo
    setLogoAnimation(true)

    // Después de que la animación del logo termine (0.8 segundo), inicia la del texto
    const logoTimeout = setTimeout(() => {
      setTextAnimation(true)
    }, 800)

    // Después de 2.2 segundos, inicia el fade out
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true)
    }, 2200)

    // Después de que el fade out termine (0.8 segundos), redirige
    const redirectTimeout = setTimeout(() => {
      if (!loading) {
        navigate(user ? '/' : '/login')
      }
    }, 3000)

    // Limpia los timeouts para evitar problemas si el componente se desmonta
    return () => {
      clearTimeout(logoTimeout)
      clearTimeout(fadeTimeout)
      clearTimeout(redirectTimeout)
    }
  }, [user, loading, navigate])

  // Renderiza el splash screen
  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img
          src="/SrPol.png"
          alt="SrPol Logo"
          className={`splash-logo ${logoAnimation ? 'scale-up' : ''}`}
        />
        <div className={`splash-text ${textAnimation ? 'fade-in' : ''}`}>
          <h1 className="splash-title">SrPol</h1>
          <p className="splash-subtitle">Delicias a tu mesa</p>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
