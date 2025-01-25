// src/components/pedidos/PedidoForm.tsx
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../hooks/useAuth";
import { useMenu } from "../../hooks/useMenu";
import { db } from "../../utils/firebase";

interface PedidoFormProps {
  onClose: () => void;
  people?: {
    id: string;
    name: string;
    items: { id: string; quantity: number }[];
  }[];
}

const PedidoForm: React.FC<PedidoFormProps> = ({ onClose, people }) => {
  const { menu } = useMenu();
  const { user, addPoints } = useAuth();

  const [items, setItems] = useState<
    { id: string; quantity: number; assignedTo: string }[]
  >([]);
  const [peopleOrder, setPeopleOrder] = useState<
    { id: string; name: string }[]
  >([]);
  const [sede, setSede] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryIncluded, setDeliveryIncluded] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("contraentrega");

  useEffect(() => {
    if (people) {
      setPeopleOrder(
        people.map((person) => ({ id: person.id, name: person.name }))
      );
      const newItems = people.flatMap((person) =>
        person.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          assignedTo: person.name,
        }))
      );
      setItems(newItems);
    }
  }, [people]);

  // Simulación de sedes disponibles (puedes obtenerlas de Firestore)
  const sedesDisponibles = ["Sede Norte", "Sede Sur", "Sede Centro"];

  useEffect(() => {
    if (sedesDisponibles.length === 1) {
      setSede(sedesDisponibles[0]);
    }
  }, [sedesDisponibles]);

  const calculateTotal = () => {
    let total = 0;
    items.forEach((item) => {
      const menuItem = menu.find((m) => m.id === item.id);
      if (menuItem) {
        total += menuItem.price * item.quantity;
      }
    });
    return total + deliveryFee;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      const total = calculateTotal();
      const orderId = uuidv4();
      const orderData = {
        userId: user.uid,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          assignedTo: item.assignedTo,
        })),
        people: peopleOrder,
        sede: sede,
        status: "pendiente",
        total: total,
        deliveryFee: deliveryFee,
        deliveryIncluded: deliveryIncluded,
        paymentMethod: paymentMethod,
        orderDate: Timestamp.now(),
        orderId: orderId,
      };

      await addDoc(collection(db, "pedidos"), orderData);
      handlePaymentSuccess();
    } catch (error) {
      console.error("Error al agregar el pedido:", error);
    }
  };

  const handlePaymentSuccess = async () => {
    // Sumar puntos al usuario
    await addPoints();
    alert("Pedido realizado con éxito y puntos sumados.");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Realizar Pedido
      </Typography>

      {/* Seleccionar Sede */}
      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel>Sede</InputLabel>
        <Select
          value={sede}
          label="Sede"
          onChange={(e) => setSede(e.target.value)}
          required
        >
          {sedesDisponibles.map((sedeItem) => (
            <MenuItem value={sedeItem} key={sedeItem}>
              {sedeItem}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Costo de Envío */}
      <TextField
        label="Costo de Envío"
        type="number"
        value={deliveryFee}
        onChange={(e) => setDeliveryFee(parseFloat(e.target.value))}
        fullWidth
        sx={{ marginBottom: 2 }}
        required
        inputProps={{ min: 0 }}
      />

      {/* Domicilio Incluido */}
      <FormControlLabel
        control={
          <Checkbox
            checked={deliveryIncluded}
            onChange={(e) => setDeliveryIncluded(e.target.checked)}
          />
        }
        label="¿El domicilio está incluido?"
        sx={{ marginBottom: 2 }}
      />

      {/* Método de Pago */}
      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel>Método de Pago</InputLabel>
        <Select
          value={paymentMethod}
          label="Método de Pago"
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <MenuItem value="contraentrega">Contraentrega</MenuItem>
          {/* Puedes añadir otros métodos de pago si lo deseas */}
        </Select>
      </FormControl>

      <Button type="submit" variant="contained" color="primary" fullWidth>
        Realizar Pedido
      </Button>
    </form>
  );
};

export default PedidoForm;
