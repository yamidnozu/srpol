// src/components/layout/MainLayout.tsx
import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Ajusta el breakpoint según tus necesidades
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Navbar toggleDrawer={handleDrawerToggle} />
      <Sidebar drawerOpen={drawerOpen} handleDrawerClose={handleDrawerClose} />
      <main
        className={`flex-1 overflow-x-hidden overflow-y-auto p-4 ${
          isMobile ? 'pt-16' : 'md:pl-64'
        }`}
      >
        <div className="container mx-auto">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default MainLayout
