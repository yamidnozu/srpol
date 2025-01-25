// src/pages/GestionUsuarios.tsx
import {
    Button,
    Container,
    List,
    ListItem,
    ListItemText,
    Typography,
} from "@mui/material";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase";

interface Usuario {
  uid: string;
  email: string;
  role: string;
  points: number;
}

const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const usuariosCol = collection(db, "users");
      const usuariosSnapshot = await getDocs(usuariosCol);
      const usuariosList = usuariosSnapshot.docs.map((doc) => ({
        uid: doc.id,
        email: doc.data().email || "No email",
        role: doc.data().role,
        points: doc.data().points || 0,
      }));
      setUsuarios(usuariosList);
    };

    fetchUsuarios();
  }, []);

  const cambiarRol = async (uid: string, nuevoRol: string) => {
    const usuarioRef = doc(db, "users", uid);
    await updateDoc(usuarioRef, { role: nuevoRol });
    setUsuarios((prevUsuarios) =>
      prevUsuarios.map((usuario) =>
        usuario.uid === uid ? { ...usuario, role: nuevoRol } : usuario
      )
    );
  };

  return (
    <Container sx={{ marginY: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <List>
        {usuarios.map((usuario) => (
          <ListItem key={usuario.uid}>
            <ListItemText
              primary={`Correo: ${usuario.email}`}
              secondary={`Rol: ${usuario.role} | Puntos: ${usuario.points}`}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                cambiarRol(
                  usuario.uid,
                  usuario.role === "admin" ? "client" : "admin"
                )
              }
            >
              Cambiar a {usuario.role === "admin" ? "Cliente" : "Administrador"}
            </Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default GestionUsuarios;
