import { Container, Typography } from "@mui/material";
import React from "react";

const Dashboard: React.FC = () => {
  return (
    <Container sx={{ marginY: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Bienvenido al panel de control, aqui podras ver un resumen de la
        aplicacion.
      </Typography>
    </Container>
  );
};

export default Dashboard;
