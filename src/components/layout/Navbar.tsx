/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
// src/components/layout/Navbar.tsx
import MenuIcon from '@mui/icons-material/Menu'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface NavbarProps {
  toggleDrawer: () => void
}

const Navbar: React.FC<NavbarProps> = ({ toggleDrawer }) => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 md:hidden transition-colors duration-200" // Transición en el icono
            aria-label="Abrir menú"
            onClick={toggleDrawer}
          >
            <MenuIcon className="transition-transform duration-300 hover:scale-110" />{' '}
            {/* Transición y escala en hover del icono */}
          </button>

          <img
            src="SrPolTitulo.png"
            alt="SrPol Logo"
            className="h-10 mr-2 transition-transform duration-300 hover:scale-105" // Transición en el logo
          />
          {/* Transición en el título */}
        </div>
        {user && (
          <div className=" md:flex items-center">
            <span className="hidden md:flex items-center text-gray-700 mr-4">{user.email}</span>
            <button
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 hover:scale-105" // Transición en el botón
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
