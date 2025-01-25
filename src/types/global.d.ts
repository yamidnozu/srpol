// src/types/global.d.ts
interface MercadoPago {
    new (publicKey: string, options?): {
       checkout: (params) => void;
    }
  }
  
  interface Window {
    MercadoPago?: MercadoPago;
  }

  interface window {
    Stripe: (publicKey: string) => void;
  }