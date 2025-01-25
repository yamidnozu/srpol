// src/pages/Success.tsx
import { Container, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handlePaymentNotification } from "../payment/payment";
import "../styles/global.css";

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  useEffect(() => {
    const handleSuccessPayment = async () => {
      if (sessionId) {
        try {
          await handlePaymentNotification(sessionId);
          navigate("/pedidos");
        } catch (error) {
          console.log(
            "Error al procesar el pago:",
            (error as { message: string }).message
          );
          navigate("/pedidos");
        }
      } else {
        navigate("/pedidos");
      }
    };
    handleSuccessPayment();
  }, [navigate, sessionId]);

  return (
    <Container>
      <Typography variant="h4">Pago exitoso, gracias por tu compra</Typography>
    </Container>
  );
};

export default Success;
