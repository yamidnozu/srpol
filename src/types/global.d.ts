/* src/types/global.d.ts */
// Importa la interfaz MenuItem desde el contexto correcto
import { MenuItem } from '../context/AppContext'

declare global {
  interface Window {
    MercadoPago?: MercadoPago
    Stripe: (publicKey: string) => void
  }
  export type MenuItemType = MenuItem // Exporta MenuItemType

  // Define las interfaces para contabilidad aquí
  interface Movement {
    movementId: string
    type: 'entry' | 'exit'
    amount: number
    concept: string
    description?: string
    category: string
    method: string
    createdAt: string | number | Date
    createdBy: string
  }

  interface DailyCashRegister {
    id?: string
    date: string
    openingAmount: number
    closingAmount?: number
    realClosingAmount?: number
    discrepancy?: number
    status: 'open' | 'closed'
    createdBy: string
    closedBy?: string
    movements: Movement[]
    savings?: number; // Para guardar el ahorro diario
    baseAmount?: number; // Para guardar la base diaria
    dailyStaffPayments?: number; // Para guardar los pagos diarios al personal
    dailySalesRevenue?: number; // Para guardar los ingresos por ventas diarias
  }

  interface Expense {
    expenseId: string;
    date: string;
    amount: number;
    category: string;
    description?: string;
    paymentMethod: string;
    registeredBy: string;
    createdAt: string | number | Date;
  }

  interface StaffPayment {
    paymentId: string;
    date: string;
    employeeName: string;
    amount: number;
    paymentType: 'daily' | 'monthly' | 'quincenal';
    paymentMethod: string;
    registeredBy: string;
    createdAt: string | number | Date;
  }
}

interface MercadoPago {
  new(
    publicKey: string,
    options?,
  ): {
    checkout: (params) => void
  }
}

export { }; // Exporta un objeto vacío para evitar error de módulo

declare module '*.svg?url' {
  const content: string;
  export default content;
}
declare module '*.svg' {
  const content: string;
  export default content;
}