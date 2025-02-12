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
    }, 100)

    // Después de 2.2 segundos, inicia el fade out
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true)
    }, 5000)

    // Después de que el fade out termine (0.8 segundos), redirige
    const redirectTimeout = setTimeout(() => {
      if (!loading) {
        navigate(user ? '/' : '/login')
      }
    }, 100)

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
          <p className="splash-subtitle">Pollo de rechupete</p>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
