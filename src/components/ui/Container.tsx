// src/components/ui/Container.tsx
import React, { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string; // Para clases adicionales de Tailwind si las necesitas
}

const Container: React.FC<ContainerProps> = ({ children, className }) => {
  return (
    <div className={`container mx-auto px-4 ${className || ''}`}> {/* Clases container, margen horizontal automático y padding x por defecto, y clases adicionales */}
      {children}
    </div>
  );
};

export default Container;