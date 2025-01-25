// src/components/layout/Sidebar.tsx
import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import ListItem from "../ui/ListItem";

interface SidebarProps {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerOpen, handleDrawerClose }) => {
  const { userRole } = useAuth();
  const menuItems = [
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
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
        },
      }}
      variant="temporary" // Cambiado a 'temporary' para mejor responsividad
      anchor="left"
      open={drawerOpen}
      onClose={handleDrawerClose}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Navegación
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: "auto" }}>
        <List>
          {menuItems
            .filter(
              (item) =>
                item.roles.includes(userRole || "public") ||
                item.roles.includes("public")
            )
            .map((item) => (
              <ListItem to={item.path} button key={item.text}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
