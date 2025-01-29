// src/types/global.d.ts
import { MenuItem } from '../context/AppContext'

declare global {
  interface Window {
    MercadoPago?: MercadoPago
    Stripe: (publicKey: string) => void
  }
  export type MenuItemType = MenuItem // Exporta MenuItemType
}

interface MercadoPago {
  new (
    publicKey: string,
    options?,
  ): {
    checkout: (params) => void
  }
}

export {} // Exporta un objeto vacío para evitar error de módulo
