// src/components/layout/Sidebar.tsx
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material"; // Mantendremos iconos de MUI por ahora
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; // Icono de MUI, puedes reemplazarlo
import {
  Divider,
  IconButton,
} from "@mui/material"; // Mantenemos Divider e IconButton de MUI para facilitar la migración o puedes buscar alternativas Tailwind
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import ListItem from "../ui/ListItem";

interface SidebarProps {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerOpen, handleDrawerClose }) => {
  const { userRole } = useAuth();
  const menuItems = [ /* ... menuItems igual ... */
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/",
      roles: ["admin", "encargado", "client"],
    },
    {
      text: "Menú",
      icon: <RestaurantMenuIcon />,
      path: "/menu",
      roles: ["admin", "encargado", "client"],
    },
    {
      text: "Pedidos",
      icon: <ShoppingCartIcon />,
      path: "/pedidos",
      roles: ["admin", "encargado", "client"],
    },
    {
      text: "Gestionar Menú",
      icon: <SettingsIcon />,
      path: "/gestion-menu",
      roles: ["admin", "encargado"],
    },
    {
      text: "Perfil",
      icon: <PersonIcon />,
      path: "/perfil",
      roles: ["admin", "encargado", "client"],
    },
    {
      text: "Gestión de Usuarios",
      icon: <PeopleIcon />,
      path: "/gestion-usuarios",
      roles: ["admin"],
    },
  ];

  return (
    <aside
      className={`bg-gray-50 w-60 flex-shrink-0 overflow-y-auto fixed top-16 md:top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`} // Reemplaza Drawer con aside y clases Tailwind, lógica para drawerOpen
    >
      <div className="py-4 px-3 flex justify-between items-center"> {/* Reemplaza Toolbar */}
        <span className="text-lg font-semibold text-gray-900">Navegación</span> {/* Reemplaza Typography */}
        <IconButton onClick={handleDrawerClose} className="md:hidden"> {/* IconButton para cerrar en mobile, oculto en md y superior */}
          <ChevronLeftIcon /> {/* Icono de MUI */}
        </IconButton>
      </div>
      <Divider /> {/* Mantenemos Divider de MUI o puedes usar una hr con estilos Tailwind */}
      <ul className="pt-4"> {/* Reemplaza List con ul */}
        {menuItems
          .filter(
            (item) =>
              item.roles.includes(userRole || "public") ||
              item.roles.includes("public")
          )
          .map((item) => (
            <li key={item.text} className="mb-1"> {/* Reemplaza ListItem con li y margen bottom */}
              <ListItem to={item.path} button onClick={handleDrawerClose}> {/* Mantenemos ListItem custom component */}
                <span className="ml-3 mr-2">{item.icon}</span> {/* Reemplaza ListItemIcon con span para el icono */}
                <span className="text-gray-700 hover:text-gray-900">{item.text}</span> {/* Reemplaza ListItemText con span para el texto */}
              </ListItem>
            </li>
          ))}
      </ul>
    </aside>
  );
};

export default Sidebar;