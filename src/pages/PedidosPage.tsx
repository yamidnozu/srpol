
import { Container, Typography } from "@mui/material";
import React from "react";
import PedidoList from "../components/pedidos/PedidoList";

const PedidosPage: React.FC = () => {
  return (
    <Container sx={{ marginY: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Pedidos
      </Typography>
      <PedidoList />
    </Container>
  );
};

export default PedidosPage;
