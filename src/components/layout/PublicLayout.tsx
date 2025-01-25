// src/components/layout/PublicLayout.tsx
import React, { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {" "}
      {/* Clases Tailwind para centrar y fondo */}
      {children}
    </div>
  );
};

export default PublicLayout;
