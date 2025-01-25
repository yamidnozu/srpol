// src/pages/Perfil.tsx
import {
  Alert,
  Avatar,
  Button,
  Container,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const Perfil: React.FC = () => {
  const { user, addPoints, points } = useAuth();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleAddPoints = async () => {
    try {
      await addPoints();
      setSnackbar({
        open: true,
        message: "Puntos agregados exitosamente.",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Error al agregar puntos.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container sx={{ marginY: 3 }}>
      <Paper sx={{ padding: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4} sx={{ textAlign: "center" }}>
            <Avatar
              alt={user?.email}
              src="/static/images/avatar/1.jpg"
              sx={{ width: 120, height: 120, margin: "0 auto" }}
            />
            <Typography variant="h6" sx={{ mt: 2 }}>
              {user?.email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Typography variant="h5" gutterBottom>
              Información del Perfil
            </Typography>
            <Typography variant="body1">
              <strong>UID:</strong> {user?.uid}
            </Typography>
            <Typography variant="body1">
              <strong>Puntos:</strong> {points}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddPoints}
              sx={{ mt: 2 }}
            >
              Sumar 10 Puntos
            </Button>
          </Grid>
        </Grid>
      </Paper>
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

export default Perfil;
