import { Alert, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  createCheckoutSession,
  handlePaymentNotification,
  processPayment,
} from "../../payment/payment";

interface PaymentFormProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
}
const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  orderId,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [paymentResult] = useState<string | null>(null);
  useEffect(() => {
    const loadPublicKey = async () => {
      setPublicKey("YOUR_STRIPE_PUBLIC_KEY");
    };
    loadPublicKey();
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!publicKey) {
        setError("Clave publica no encontrada");
        setLoading(false);
        setTimeout(() => setError(null), 5000);
        return;
      }
      const sessionId = await createCheckoutSession(amount, orderId);
      await processPayment(sessionId, publicKey);
      const response = await handlePaymentNotification(sessionId);
      if (response) {
        setLoading(false);
        onSuccess();
      } else {
        throw new Error("Error al procesar el pago");
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {paymentResult === "success" && (
        <Alert severity="success">Pago Exitoso</Alert>
      )}
      {paymentResult === "failure" && (
        <Alert severity="error">Pago Fallido</Alert>
      )}
      {paymentResult === "pending" && (
        <Alert severity="info">Pago Pendiente</Alert>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? "Procesando" : "Pagar"}
      </Button>
    </>
  );
};
export default PaymentForm;
