// src/components/layout/MainLayout.tsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {" "}
      {/* Reemplaza Box con div y clases Tailwind para layout flex y altura de pantalla */}
      <Navbar toggleDrawer={handleDrawerToggle} />
      <Sidebar drawerOpen={drawerOpen} handleDrawerClose={handleDrawerClose} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
        {" "}
        {/* Reemplaza Box main con main y clases flex-grow y padding */}
        <div className="container mx-auto">
          {" "}
          {/* Reemplaza Grid container con div container para centrar contenido */}
          <div className="w-full">
            {" "}
            {/* Reemplaza Grid item con div full width */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
