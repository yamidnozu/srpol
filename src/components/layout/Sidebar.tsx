// src/components/layout/Sidebar.tsx
import {
  AddBusiness as AddBusinessIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom' // Importa NavLink y useLocation
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  drawerOpen: boolean
  handleDrawerClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ drawerOpen, handleDrawerClose }) => {
  const { userRole } = useAuth()
  const location = useLocation() // Hook para obtener la ruta actual

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      roles: ['admin', 'encargado', 'client'],
    },
    {
      text: 'Menú',
      icon: <RestaurantMenuIcon />,
      path: '/menu',
      roles: ['admin', 'encargado', 'client'],
    },
    {
      text: 'Pedidos',
      icon: <ShoppingCartIcon />,
      path: '/pedidos',
      roles: ['admin', 'encargado', 'client'],
    },
    {
      text: 'Gestionar Menú',
      icon: <SettingsIcon />,
      path: '/gestion-menu',
      roles: ['admin', 'encargado'],
    },
    {
      text: 'Perfil',
      icon: <PersonIcon />,
      path: '/perfil',
      roles: ['admin', 'encargado', 'client'],
    },
    {
      text: 'Gestión de Usuarios',
      icon: <PeopleIcon />,
      path: '/gestion-usuarios',
      roles: ['admin'],
    },
    {
      text: 'Contabilidad',
      icon: <AddBusinessIcon />, // Algún ícono que quieras (o un emoji de dinero 💸)
      path: '/contabilidad',
      roles: ['admin', 'encargado'],
    },
  ]

  return (
    <aside
      className={`bg-gray-50 w-64 flex-shrink-0 overflow-y-auto fixed top-16 md:top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      } md:shadow-md`} // Shadow en desktop
    >
      <div className="py-6 px-4 md:px-6">
        {' '}
        {/* Más padding en desktop */}
        <span className="text-xl font-semibold text-gray-900 block mb-2 md:hidden text-center">
          Navegación
        </span>{' '}
        {/* Título en mobile */}
        <nav className="space-y-2">
          {menuItems
            .filter(
              (item) => item.roles.includes(userRole || 'public') || item.roles.includes('public'),
            )
            .map((item) => {
              const isActive = location.pathname === item.path // Verifica si la ruta coincide
              return (
                <NavLink
                  key={item.text}
                  to={item.path}
                  className={({
                    isActive,
                  }) => `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                                      ${
                                        isActive
                                          ? 'bg-indigo-100 text-indigo-700'
                                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                      }`}
                  onClick={handleDrawerClose} // Cierra el drawer en mobile al hacer clic
                >
                  <span
                    className={`mr-3 h-6 w-6 flex items-center justify-center ${
                      isActive ? 'text-indigo-500' : 'text-gray-500 group-hover:text-gray-600'
                    }`}
                  >
                    {' '}
                    {/* Icon color changes on hover and active */}
                    {item.icon}
                  </span>
                  {item.text}
                </NavLink>
              )
            })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
