/* src/pages/ContabilidadPage.tsx */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'

import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { db } from '../utils/firebase'
// src/utils/formatting.ts
export const formatNumberInput = (value: string): string => {
  // Remueve puntos y luego formatea el número a string con separador de miles
  const numberValue = Number(value.replace(/\./g, ''))
  if (isNaN(numberValue)) return ''
  return numberValue.toLocaleString('es-CO')
}

export const parseNumberInput = (formattedValue: string): number => {
  // Quita los separadores y convierte a número
  return Number(formattedValue.replace(/\./g, ''))
}

export const formatPriceCOP = (price: number): string => {
  return price.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Nueva interfaz para la fila del balance
interface BalanceRow {
  cuenta: string
  debe: number
  haber: number
  saldo: number
}

const ContabilidadPage: React.FC = () => {
  const { user, userRole } = useAuth()
  const [cashRegisters, setCashRegisters] = useState<DailyCashRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [openingAmountInput, setOpeningAmountInput] = useState<string>('') // Valor formateado (por ejemplo, "50.000")
  const [openDayError, setOpenDayError] = useState<string | null>(null)
  const [ordersTotal, setOrdersTotal] = useState<number>(0)
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]) // Estado para las filas del balance

  // Suscribirse a la colección de caja (registro diario)
  useEffect(() => {
    const qRef = query(collection(db, 'caja'))
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      const data: DailyCashRegister[] = snapshot.docs.map((doc) => {
        const docData = doc.data()
        return {
          id: doc.id,
          ...docData,
        } as DailyCashRegister
      })
      setCashRegisters(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Suscribirse a la colección de pedidos filtrando por el día actual para sumar sus totales
  useEffect(() => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const ordersQuery = query(
      collection(db, 'pedidos'),
      where('orderDate', '>=', startOfDay),
      where('orderDate', '<', endOfDay),
    )

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      let total = 0
      snapshot.docs.forEach((doc) => {
        total += doc.data().total || 0
      })
      setOrdersTotal(total)
    })

    return () => unsubscribeOrders()
  }, [])

  // Procesar los registros de caja para generar las filas del balance
  useEffect(() => {
    if (!cashRegisters || cashRegisters.length === 0) {
      setBalanceRows([])
      return
    }

    const rowsMap: { [cuenta: string]: BalanceRow } = {}

    cashRegisters.forEach((register) => {
      register.movements.forEach((mov) => {
        let cuentaNombre = ''
        if (mov.category === 'venta') {
          cuentaNombre = 'Ingresos por Ventas'
        } else if (mov.category === 'nomina') {
          cuentaNombre = 'Gastos de Nómina'
        } else if (mov.category === 'compra_insumos') {
          cuentaNombre = 'Gastos de Insumos'
        } else if (mov.category === 'pago_servicios') {
          cuentaNombre = 'Gastos de Servicios'
        } else if (mov.category === 'otros') {
          cuentaNombre = mov.concept || 'Otros Gastos/Ingresos' // Usar concept como nombre si es 'otros'
        } else {
          cuentaNombre = 'Cuenta Desconocida'
        }

        if (!rowsMap[cuentaNombre]) {
          rowsMap[cuentaNombre] = { cuenta: cuentaNombre, debe: 0, haber: 0, saldo: 0 }
        }

        if (mov.type === 'entry') {
          rowsMap[cuentaNombre].haber += mov.amount
        } else if (mov.type === 'exit') {
          rowsMap[cuentaNombre].debe += mov.amount
        }
      })
    })

    // Calcular saldos y convertir el mapa a un array ordenado
    let saldoAcumulado = 0
    const rowsArray: BalanceRow[] = Object.values(rowsMap).map((row) => {
      saldoAcumulado = saldoAcumulado + row.haber - row.debe
      return { ...row, saldo: saldoAcumulado }
    })

    setBalanceRows(rowsArray)
  }, [cashRegisters])

  const handleOpenDay = async () => {
    if (!user) return

    const opening = parseNumberInput(openingAmountInput)

    if (isNaN(opening) || opening <= 0) {
      setOpenDayError('Por favor, ingrese un monto de apertura válido mayor que cero.')
      return
    }
    setOpenDayError(null)

    // Verificar si ya hay un registro "open"
    const alreadyOpen = cashRegisters.find((reg) => reg.status === 'open')
    if (alreadyOpen) {
      alert('Ya hay un día abierto, ciérralo primero antes de abrir otro.')
      return
    }

    const today = new Date()
    const dateStr = today.toISOString().split('T')[0] // Formato "YYYY-MM-DD"

    try {
      await addDoc(collection(db, 'caja'), {
        date: dateStr,
        openingAmount: opening,
        status: 'open',
        createdBy: user.uid,
        movements: [],
        dailySalesRevenue: 0, // Inicializa ingresos de ventas diarias
        dailyStaffPayments: 0, // Inicializa pagos diarios al personal
        baseAmount: 0, // Inicializa base diaria
      })
      alert('Día abierto exitosamente.')
      setOpeningAmountInput('') // Reinicia el input
    } catch (error) {
      console.error('Error al abrir el día:', error)
      alert('Ocurrió un error al abrir el día')
    }
  }

  const handleOpeningAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Formatea el valor ingresado para mostrar separadores de miles
    setOpeningAmountInput(formatNumberInput(e.target.value))
  }

  const goToDetail = (id: string) => {
    window.location.href = `/contabilidad/${id}`
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4">Cargando datos de contabilidad...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-indigo-700">Contabilidad / Caja</h1>
        <p className="mb-4 text-gray-600 text-center">
          Aquí podrás abrir un nuevo día, registrar movimientos y cerrar la caja diaria.
        </p>

        {(userRole === 'admin' || userRole === 'encargado') && (
          <div className="text-center mb-4">
            {openDayError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-3"
                role="alert"
              >
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {openDayError}</span>
              </div>
            )}
            <div className="flex justify-center items-center space-x-2 mb-2">
              <label htmlFor="openingAmount" className="block text-sm font-bold text-gray-700">
                Monto de Apertura:
              </label>
              <input
                type="text"
                id="openingAmount"
                className="shadow appearance-none border rounded w-32 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ej: 50.000"
                value={openingAmountInput}
                onChange={handleOpeningAmountInputChange}
              />
            </div>
            <button
              onClick={handleOpenDay}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Abrir Nuevo Día
            </button>
            {/* Mostrar el total de pedidos del día */}
            <div className="mt-4">
              <p className="text-lg font-medium">
                Total de Pedidos del Día: {formatPriceCOP(ordersTotal)}
              </p>
            </div>
          </div>
        )}

        {/* Nueva sección para la tabla de balance */}
        <div className="mt-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Balance General</h2>
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2">Cuenta</th>
                <th className="border border-gray-200 px-4 py-2">Debe</th>
                <th className="border border-gray-200 px-4 py-2">Haber</th>
                <th className="border border-gray-200 px-4 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balanceRows.map((row, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="border border-gray-200 px-4 py-2">{row.cuenta}</td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatPriceCOP(row.debe)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatPriceCOP(row.haber)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatPriceCOP(row.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold">
              <tr>
                <td className="border border-gray-200 px-4 py-2">Total</td>
                <td className="border border-gray-200 px-4 py-2 text-right">
                  {formatPriceCOP(balanceRows.reduce((sum, row) => sum + row.debe, 0))}
                </td>
                <td className="border border-gray-200 px-4 py-2 text-right">
                  {formatPriceCOP(balanceRows.reduce((sum, row) => sum + row.haber, 0))}
                </td>
                <td className="border border-gray-200 px-4 py-2 text-right">
                  {formatPriceCOP(balanceRows.slice(-1)[0]?.saldo || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          {cashRegisters.map((reg) => (
            <div
              key={reg.id}
              className="border p-4 rounded flex justify-between items-center shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100"
            >
              <div>
                <p>
                  <strong>Fecha:</strong> {reg.date}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={reg.status === 'open' ? 'text-green-600' : 'text-gray-600'}>
                    {reg.status.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Apertura:</strong> {formatPriceCOP(reg.openingAmount)}
                </p>
                {reg.status === 'closed' && (
                  <>
                    <p>
                      <strong>Declarado al Cerrar:</strong> {formatPriceCOP(reg.closingAmount || 0)}
                    </p>
                    <p>
                      <strong>Efectivo Real Contado:</strong>{' '}
                      {formatPriceCOP(reg.realClosingAmount || 0)}
                    </p>
                    <p>
                      <strong>Discrepancia:</strong>{' '}
                      <span
                        className={
                          reg.discrepancy === 0
                            ? 'text-green-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {reg.discrepancy === 0
                          ? 'Todo cuadra'
                          : `${formatPriceCOP(reg.discrepancy || 0)} (Sobrante/Pérdida)`}
                      </span>
                    </p>
                    <p>
                      <strong>Ahorro del día:</strong> {formatPriceCOP(reg.savings || 0)}
                    </p>
                  </>
                )}
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
                onClick={() => goToDetail(reg.id)}
              >
                Ver Detalle
              </button>
            </div>
          ))}
        </div>

        {cashRegisters.length === 0 && (
          <p className="mt-6 text-gray-500 text-center">No hay registros de caja todavía.</p>
        )}
      </div>
    </MainLayout>
  )
}

export default ContabilidadPage
