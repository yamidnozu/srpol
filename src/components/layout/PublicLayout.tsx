// src/components/layout/PublicLayout.tsx
import React, { ReactNode } from 'react'
import '../../styles/public-layout.css' // Importa el archivo CSS para el diseño público

interface PublicLayoutProps {
  children: ReactNode
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return <div>{children}</div>
}

export default PublicLayout
