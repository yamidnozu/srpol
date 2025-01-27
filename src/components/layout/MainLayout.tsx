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
      <Navbar toggleDrawer={handleDrawerToggle} />
      <Sidebar drawerOpen={drawerOpen} handleDrawerClose={handleDrawerClose} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:pl-64">
        {" "}
        {/* Ajuste de padding lateral en desktop para el sidebar fijo */}
        <div className="container mx-auto">
          <div className="w-full">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
