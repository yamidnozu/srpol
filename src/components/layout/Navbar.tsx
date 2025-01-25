// src/components/layout/Navbar.tsx
import MenuIcon from "@mui/icons-material/Menu"; // Mantendremos el icono de MUI por ahora o puedes buscar uno de Tailwind o Heroicons
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface NavbarProps {
  toggleDrawer: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleDrawer }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50"> {/* Reemplaza AppBar con header y clases Tailwind */}
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center"> {/* Reemplaza Toolbar y Box container */}
        <div className="flex items-center"> {/* Reemplaza Box flex container */}
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 md:hidden" // Clases para el IconButton, oculto en md y superior
            aria-label="Abrir menú"
            onClick={toggleDrawer}
          >
            <MenuIcon /> {/* Mantenemos MenuIcon de MUI o reemplaza con un SVG de Heroicons */}
          </button>
          <img
            src="/public/SrPolForYouSinTitle.svg"
            alt="SrPol Logo"
            className="h-10 mr-2" // Clases para la imagen
          />
          <span className="text-xl font-semibold text-gray-900">SrPol</span> {/* Reemplaza Typography */}
        </div>
        {user && (
          <div className="hidden md:flex items-center"> {/* Reemplaza Box usuario, oculto en mobile */}
            <span className="text-gray-700 mr-4">{user.email}</span> {/* Reemplaza Typography usuario */}
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" // Reemplaza Button
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;