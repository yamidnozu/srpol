// src/payment/payment.ts
import { doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

export const updateOrderStatus = async (orderId: string, status: string) => {
    try {
        await updateDoc(doc(db, COLLECTIONS.PEDIDOS, orderId), { status: status });
        return true;
    } catch (error) {
        console.error("Error al actualizar el estado del pedido:", (error as { message: string }).message);
        throw new Error((error as { message: string }).message || "Error al actualizar el estado del pedido");
    }
};

export const handlePaymentNotification = async (session_id: string) => {
    console.log("Manejando notificacion de pago:", session_id);
    try {
        // Aquí debes implementar la lógica para verificar el pago con Stripe
        // Por ejemplo, puedes hacer una llamada a tu backend para verificar el estado del pago
        // Luego, actualizar el estado del pedido en Firestore
        // Este es un ejemplo simplificado:

        // Simulación de verificación de pago
        const paymentVerified = true; // Reemplaza con la lógica real

        if (paymentVerified) {
            // Supongamos que tienes el orderId en los metadatos de la sesión
            const orderId = "orderId_from_metadata"; // Reemplaza con el valor real
            await updateOrderStatus(orderId, "enviado");
            return true;
        } else {
            throw new Error("Pago no verificado");
        }
    } catch (error) {
        console.log("Error", (error as { message: string }).message);
        throw new Error((error as { message: string }).message || "Error al manejar la notificacion");
    }
};

declare const window;

export const createCheckoutSession = async (amount: number, orderId: string) => {
    try {
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_STRIPE_SECRET_KEY`,
            },
            body: JSON.stringify({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            unit_amount: amount * 100,
                            product_data: {
                                name: 'Pedido',
                            },
                        },
                        quantity: 1,
                    }
                ],
                mode: 'payment',
                success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: window.location.origin,
                metadata: {
                    orderId: orderId,
                },
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al crear sesion');
        }
        return data.id;
    } catch (error) {
        console.error("Error al crear la sesion de checkout:", (error as { message: string }).message);
        throw new Error((error as { message: string }).message || 'Error al crear sesion');
    }
};

export const processPayment = async (sessionId: string, publicKey: string) => {
    const stripe = window.Stripe(publicKey);
    stripe.redirectToCheckout({ sessionId });
};
