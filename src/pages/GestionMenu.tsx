// src/pages/GestionMenu.tsx
import { Alert, Button, Container, Snackbar } from "@mui/material";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import MenuList from "../components/menu/MenuList";
import MenuModal from "../components/menu/MenuModal";
import { MenuItem } from "../context/AppContext";
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
    if (!window.confirm(`¿Estás seguro de eliminar el item "${item.name}"?`))
      return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.MENU, item.id));
      setSnackbar({
        open: true,
        message: "Item eliminado exitosamente.",
        severity: "success",
      });
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al eliminar el item.",
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

  return (
    <Container sx={{ marginY: 3 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenModal}
        sx={{ mb: 2 }}
      >
        Agregar Item
      </Button>
      <MenuList menu={menu} onEdit={handleEdit} onDelete={handleDelete} />
      <MenuModal
        open={openModal}
        onClose={handleCloseModal}
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
