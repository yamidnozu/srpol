// src/components/pedidos/PedidoList.tsx
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,

  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { COLLECTIONS } from "../../utils/constants";
import { db } from "../../utils/firebase";

interface Pedido {
  id: string;
  userId: string;
  items: { id: string; quantity: number; assignedTo: string }[];
  people: { id: string; name: string }[];
  sede: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryIncluded: boolean;
  paymentMethod: string;
  orderDate: Date;
  orderId: string;
}

const PedidoList: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const { user, userRole } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("pendiente");
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedPedidoDetails, setSelectedPedidoDetails] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let pedidosQuery = query(collection(db, COLLECTIONS.PEDIDOS));

    if (userRole === "client") {
      pedidosQuery = query(
        collection(db, COLLECTIONS.PEDIDOS),
        where("userId", "==", user.uid)
      );
    } else if (userRole === "admin" || userRole === "encargado") {
      pedidosQuery = query(
        collection(db, COLLECTIONS.PEDIDOS),
        where("status", "==", selectedStatus)
      );
    }

    const unsubscribe = onSnapshot(pedidosQuery, (snapshot) => {
      const pedidosData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          items: data.items || [],
          people: data.people || [],
          sede: data.sede,
          status: data.status,
          total: data.total,
          deliveryFee: data.deliveryFee,
          deliveryIncluded: data.deliveryIncluded,
          paymentMethod: data.paymentMethod,
          orderDate: data.orderDate ? (data.orderDate).toDate() : new Date(),
          orderId: data.orderId,
        } as Pedido;
      });
      setPedidos(pedidosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userRole, selectedStatus]);

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.PEDIDOS, orderId), {
        status: newStatus,
      });
    } catch (error) {
      console.error(
        "Error actualizando el estado del pedido:",
        (error as { message: string }).message
      );
    }
  };

  const handleOpenDetails = (order: Pedido) => {
    setSelectedPedidoDetails(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedPedidoDetails(null);
    setOpenDetails(false);
  };

  // Definir columnas para DataGrid
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID del Pedido', width: 150 },
    { field: 'sede', headerName: 'Sede', width: 120 },
    { field: 'status', headerName: 'Estado', width: 120 },
    { field: 'total', headerName: 'Total ($)', width: 100 },
    { field: 'deliveryFee', headerName: 'Envío ($)', width: 100 },
    { field: 'paymentMethod', headerName: 'Pago', width: 150 },
    { 
      field: 'orderDate', 
      headerName: 'Fecha', 
      width: 180, 
      valueFormatter: (params) => new Date((params as {value: string}).value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const order: Pedido = params.row;
        return (
          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenDetails(order)}
              sx={{ mr: 1 }}
            >
              Ver Detalles
            </Button>
            {(userRole === "admin" || userRole === "encargado") && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => handleStatusUpdate(order.id, "atendiendo")}
                  disabled={order.status === "atendiendo"}
                  sx={{ mr: 1 }}
                >
                  Atender
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  onClick={() => handleStatusUpdate(order.id, "preparando")}
                  disabled={order.status === "preparando"}
                  sx={{ mr: 1 }}
                >
                  Preparar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => handleStatusUpdate(order.id, "enviado")}
                  disabled={order.status === "enviado"}
                >
                  Enviar
                </Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Tus Pedidos
      </Typography>
      {userRole !== "client" && (
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={selectedStatus}
            label="Filtrar por estado"
            onChange={handleStatusChange}
          >
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="atendiendo">Atendiendo</MenuItem>
            <MenuItem value="preparando">Preparando</MenuItem>
            <MenuItem value="enviado">Enviado</MenuItem>
          </Select>
        </FormControl>
      )}
      {loading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={pedidos}
            columns={columns}
            pageSize={10} 
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowId={(row) => row.id}
          />
        </Paper>
      )}
      <Dialog open={openDetails} onClose={handleCloseDetails} fullWidth maxWidth="md">
        <DialogTitle>Detalle del Pedido</DialogTitle>
        {selectedPedidoDetails && (
          <Box sx={{ padding: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>ID del Pedido:</strong> {selectedPedidoDetails.id}
                </Typography>
                <Typography variant="body1">
                  <strong>Estado:</strong> {selectedPedidoDetails.status}
                </Typography>
                <Typography variant="body1">
                  <strong>Total:</strong> ${selectedPedidoDetails.total}
                </Typography>
                <Typography variant="body1">
                  <strong>Costo de Envío:</strong> ${selectedPedidoDetails.deliveryFee}
                </Typography>
                <Typography variant="body1">
                  <strong>Método de Pago:</strong> {selectedPedidoDetails.paymentMethod}
                </Typography>
                <Typography variant="body1">
                  <strong>Domicilio Incluido:</strong> {selectedPedidoDetails.deliveryIncluded ? "Sí" : "No"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Sede:</strong> {selectedPedidoDetails.sede}
                </Typography>
                <Typography variant="body1">
                  <strong>Personas:</strong> {selectedPedidoDetails.people.map((p) => p.name).join(", ")}
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha del Pedido:</strong> {selectedPedidoDetails.orderDate.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Items:
            </Typography>
            <List>
              {selectedPedidoDetails.items.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`- ${item.id} (Cantidad: ${item.quantity})`}
                    secondary={`Asignado a: ${item.assignedTo || "N/A"}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default PedidoList;
