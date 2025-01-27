/* Inicio src\pages\GestionMenu.tsx */
/* Inicio src\pages\GestionMenu.tsx */
import { Alert, Snackbar } from "@mui/material";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import MenuList from "../components/menu/MenuList";
import MenuModal from "../components/menu/MenuModal";
import Button from "../components/ui/Button"; // Importa el Button de Tailwind
import Container from "../components/ui/Container"; // Importa Container de Tailwind si lo creaste, sino usa un div normal
import { MenuItem } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth"; // Importa useAuth
import { useMenu } from "../hooks/useMenu";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

const GestionMenu: React.FC = () => {
  const { menu, loading } = useMenu();
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const { userRole } = useAuth(); // Obtiene el rol del usuario
  const [loadingSampleData, setLoadingSampleData] = useState(false); // Estado de carga para el botón de datos de ejemplo

  if (loading) {
    return <div>Cargando...</div>;
  }

  const handleOpenModal = () => {
    setOpenModal(true);
    setSelectedItem(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setOpenModal(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (
      !window.confirm(
        `¿Estás seguro de marcar como no disponible a largo plazo el item "${item.name}"?`
      )
    )
      return;
    try {
      // Al "eliminar" un item, se actualiza su estado a "noDisponibleLargoPlazo" y available a false
      await updateDoc(doc(db, COLLECTIONS.MENU, item.id), {
        availabilityStatus: "noDisponibleLargoPlazo", // Se marca como no disponible a largo plazo
        available: false, // Se marca como no disponible para que no aparezca en el menu para clientes
      });
      setSnackbar({
        open: true,
        message: "Item marcado como no disponible a largo plazo.",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al actualizar el item.",
        severity: "error",
      });
    }
  };

  const handleSubmit = async (values: Partial<MenuItem>) => {
    try {
      if (selectedItem) {
        await updateDoc(doc(db, COLLECTIONS.MENU, selectedItem.id), values);
        setSnackbar({
          open: true,
          message: "Item actualizado exitosamente.",
          severity: "success",
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.MENU), values);
        setSnackbar({
          open: true,
          message: "Item agregado exitosamente.",
          severity: "success",
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al guardar el item.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Función para agregar datos de ejemplo
  const handleAddSampleData = async () => {
    setLoadingSampleData(true);
    setSnackbar({
      open: true,
      message: "Agregando datos de ejemplo...",
      severity: "success",
    });
    try {
      const sampleMenuItems = generateSampleMenuItems();
      const menuCollectionRef = collection(db, COLLECTIONS.MENU);
      for (const item of sampleMenuItems) {
        await addDoc(menuCollectionRef, item);
      }
      setSnackbar({
        open: true,
        message: "Datos de ejemplo agregados exitosamente!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error al agregar datos de ejemplo:", error);
      setSnackbar({
        open: true,
        message: "Error al agregar datos de ejemplo.",
        severity: "error",
      });
    } finally {
      setLoadingSampleData(false);
    }
  };

  const generateSampleMenuItems = () => {
    return [
      {
        name: "Hamburguesa Clásica",
        description: "Carne de res, queso cheddar, lechuga, tomate y cebolla.",
        price: 28000, // COP Approx. $8.99 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Hamburguesas",
        observations: "Se puede pedir sin cebolla.",
        availabilityStatus: "disponible",
      },
      {
        name: "Pizza Margarita Personal",
        description: "Salsa de tomate, mozzarella fresca y albahaca.",
        price: 35000, // COP Approx. $12.5 USD (Adjusted for personal size)
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Pizzas",
        observations: "Opción vegana disponible con queso de almendras.",
        availabilityStatus: "disponible",
      },
      {
        name: "Pizza Margarita Familiar",
        description: "Salsa de tomate, mozzarella fresca y albahaca.",
        price: 65000, // COP Approx. $12.5 USD (Adjusted for family size)
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Pizzas",
        observations: "Opción vegana disponible con queso de almendras.",
        availabilityStatus: "disponible",
      },
      {
        name: "Ensalada César",
        description: "Lechuga romana, crutones, parmesano y aderezo César.",
        price: 22000, // COP Approx. $6.75 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Ensaladas",
        observations: "Se puede añadir pollo a la parrilla.",
        availabilityStatus: "disponible",
      },
      {
        name: "Pasta Carbonara",
        description:
          "Spaghetti, huevo, panceta, queso pecorino romano y pimienta negra.",
        price: 32000, // COP Approx. $10.2 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Pastas",
        observations: "Sin gluten disponible con pasta de arroz.",
        availabilityStatus: "disponible",
      },
      {
        name: "Tacos al Pastor (3 unidades)",
        description: "Carne de cerdo adobada, piña, cebolla y cilantro, en tortilla de maíz. Orden de 3 tacos.",
        price: 30000, // COP Approx. $9.5 USD (for 3 tacos)
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Tacos",
        observations: "Picante medio.",
        availabilityStatus: "disponible",
      },
      {
        name: "Sushi Variado (12 piezas)",
        description: "Selección de nigiris y makis variados. 12 piezas.",
        price: 50000, // COP Approx. $15.99 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Sushi",
        observations: "Incluye salsa de soya, wasabi y jengibre.",
        availabilityStatus: "disponible",
      },
      {
        name: "Pollo Frito Individual",
        description: "1 presa grande de pollo frito, crujiente y jugoso.",
        price: 15000, // COP - Individual piece
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Pollos",
        observations: "Opción extra crujiente disponible.",
        availabilityStatus: "disponible",
      },
      {
        name: "Combo Pollo Frito Personal",
        description: "2 presas de pollo frito, papas fritas pequeñas y gaseosa personal.",
        price: 30000, // COP - Personal combo
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Combos de Pollo",
        observations: "Incluye gaseosa personal a elección.",
        availabilityStatus: "disponible",
      },
      {
        name: "Combo Pollo Frito Familiar",
        description: "6 presas de pollo frito, papas fritas familiares, ensalada coleslaw familiar y gaseosa 1.5L.",
        price: 85000, // COP - Family combo
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Combos de Pollo",
        observations: "Ideal para compartir en familia.",
        availabilityStatus: "disponible",
      },
       {
        name: "Pollo Asado Entero",
        description: "Pollo entero asado al carbón, jugoso y lleno de sabor.",
        price: 55000, // COP - Whole roasted chicken
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Pollos",
        observations: "Perfecto para compartir.",
        availabilityStatus: "disponible",
      },
      {
        name: "Sopa de Tomate",
        description: "Sopa cremosa de tomate, hecha en casa.",
        price: 18000, // COP Approx. $5.5 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Sopas",
        observations: "Servida con pan tostado.",
        availabilityStatus: "disponible",
      },
      {
        name: "Brownie con Helado",
        description: "Brownie de chocolate caliente con helado de vainilla.",
        price: 20000, // COP Approx. $6.25 USD
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Postres",
        observations: "Se puede pedir sin nueces.",
        availabilityStatus: "disponible",
      },
      {
        name: "Jugo de Naranja",
        description: "Jugo de naranja natural, recién exprimido.",
        price: 8000, // COP
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Bebidas",
        observations: "Sin azúcar añadida.",
        availabilityStatus: "disponible",
      },
      {
        name: "Limonada Natural",
        description: "Limonada refrescante, preparada al momento.",
        price: 7000, // COP
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Bebidas",
        observations: "Puedes pedirla endulzada o sin azúcar.",
        availabilityStatus: "disponible",
      },
      {
        name: "Coca-Cola Personal",
        description: "Gaseosa Coca-Cola en presentación personal.",
        price: 5000, // COP
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Gaseosas",
        observations: "",
        availabilityStatus: "disponible",
      },
      {
        name: "Sprite Personal",
        description: "Gaseosa Sprite en presentación personal.",
        price: 5000, // COP
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Gaseosas",
        observations: "",
        availabilityStatus: "disponible",
      },
       {
        name: "Agua con gas Personal",
        description: "Agua con gas en presentación personal.",
        price: 4000, // COP
        imageUrl:
          "https://tofuu.getjusto.com/orioneat-local/resized2/6GwfDxr96Ey4RnvzH-300-x.webp",
        available: true,
        recommendation: "Bebidas",
        observations: "",
        availabilityStatus: "disponible",
      },
    ];
  };

  return (
    <Container className="my-3">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenModal}
          className=""
        >
          Agregar Item
        </Button>
        {/* Botón "Agregar datos de ejemplo" condicional */}
        {(userRole === "admin" || userRole === "encargado") && (
          <Button
            variant="contained"
            color="success"
            onClick={handleAddSampleData}
            disabled={loadingSampleData}
          >
            {loadingSampleData ? "Cargando Menú..." : "Cargar Menú Ejemplo"}
          </Button>
        )}
      </div>

      <MenuList menu={menu} onEdit={handleEdit} onDelete={handleDelete} />
      <MenuModal
        open={openModal}
        onClose={handleCloseModal} // Pass handleCloseModal as onClose
        initialValues={selectedItem || undefined}
        onSubmit={handleSubmit}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionMenu;

/* Fin src\pages\GestionMenu.tsx */
/* Fin src\pages\GestionMenu.tsx */
