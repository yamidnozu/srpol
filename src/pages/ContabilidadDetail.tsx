/* src\pages\ContabilidadDetail.tsx */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
// src/pages/ContabilidadDetail.tsx
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import CurrencyInput from '../components/ui/CurrencyInput'
import { useAuth } from '../hooks/useAuth'
import { COLLECTIONS } from '../utils/constants'
import { db } from '../utils/firebase'

import { formatPriceCOP } from './ContabilidadPage'
import { Pedido } from './Dashboard'

// Interfaces - Asegúrate de que Movement y DailyCashRegister estén definidas en global.d.ts o impórtalas si las has definido en otro archivo.

const ContabilidadDetail: React.FC = () => {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [registerData, setRegisterData] = useState<DailyCashRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordersOfTheDay, setOrdersOfTheDay] = useState<Pedido[]>([]) // Nuevo estado para pedidos del día

  // Estados para registrar un movimiento
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry')
  const [movementAmount, setMovementAmount] = useState<number>(0)
  const [movementConcept, setMovementConcept] = useState<string>('')
  const [movementDescription, setMovementDescription] = useState<string>('')
  const [movementCategory, setMovementCategory] = useState<string>('venta')
  const [movementMethod, setMovementMethod] = useState<string>('efectivo')

  // Estados para el cierre de caja
  const [closingAmount, setClosingAmount] = useState<number>(0)
  const [realClosingAmount, setRealClosingAmount] = useState<number>(0)
  const [dailySalesRevenue, setDailySalesRevenue] = useState<number>(0) // Nuevo estado para ingresos de ventas diarias
  const [dailyStaffPayments, setDailyStaffPayments] = useState<number>(0) // Nuevo estado para pagos diarios al personal
  const [baseAmount, setBaseAmount] = useState<number>(0) // Nuevo estado para la base diaria

  useEffect(() => {
    if (!params.id) {
      setLoading(false)
      return
    }
    const docRef = doc(db, 'caja', params.id)
    const unsubscribe = onSnapshot(
      docRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setLoading(false)
          return
        }
        const data = snapshot.data() as Omit<DailyCashRegister, 'id'>
        setRegisterData({
          id: snapshot.id,
          ...data,
        } as DailyCashRegister)
        setDailySalesRevenue(data.dailySalesRevenue || 0)
        setDailyStaffPayments(data.dailyStaffPayments || 0)
        setBaseAmount(data.baseAmount || 0)

        // Corregido: se interpreta la fecha en horario local
        const startOfDay = new Date(`${data.date}T00:00:00`)
        const endOfDay = new Date(`${data.date}T23:59:59.999`)

        const ordersQuery = query(
          collection(db, COLLECTIONS.PEDIDOS),
          where('orderDate', '>=', startOfDay),
          where('orderDate', '<=', endOfDay),
        )
        const ordersSnapshot = await getDocs(ordersQuery)
        let ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pedido[]

        ordersData = ordersData.map((order) => ({
          ...order,
          total: typeof order.total === 'number' ? order.total : 0,
        }))
        setOrdersOfTheDay(ordersData)
        console.log('Orders of the day:', ordersData)

        setLoading(false)
      },
      (error) => {
        console.error('Error al suscribirse al pedido grupal:', error)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [params.id])

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 text-center">Cargando detalle...</div>
      </MainLayout>
    )
  }

  if (!registerData) {
    return (
      <MainLayout>
        <div className="p-4 text-center">No se encontró el registro de caja.</div>
      </MainLayout>
    )
  }

  // Cálculo en tiempo real
  const totalEntries = registerData.movements
    .filter((m) => m.type === 'entry')
    .reduce((acc, cur) => acc + cur.amount, 0)
  const totalExits = registerData.movements
    .filter((m) => m.type === 'exit')
    .reduce((acc, cur) => acc + cur.amount, 0)
  const expectedOrdersIncome = ordersOfTheDay.reduce((acc, order) => {
    return acc + (order.total || 0) // Ensure order.total is treated as number
  }, 0) // Ingresos esperados de pedidos
  const expectedClose =
    registerData.openingAmount + totalEntries - totalExits + expectedOrdersIncome

  // Cálculo del ahorro
  const calculateSavings = () => {
    const savings = dailySalesRevenue - baseAmount - dailyStaffPayments
    return Math.max(0, savings) // Asegura que el ahorro no sea negativo
  }

  const savingsAmount = calculateSavings()

  const handleAddMovement = async () => {
    if (!user) return
    if (registerData.status === 'closed') {
      alert('Día cerrado, no se pueden agregar movimientos.')
      return
    }
    const movement: Movement = {
      movementId: crypto.randomUUID(),
      type: movementType,
      amount: movementAmount,
      concept: movementConcept.trim() || 'Sin concepto',
      description: movementDescription.trim(),
      category: movementCategory,
      method: movementMethod,
      createdAt: new Date().toISOString(), // Guarda la fecha como ISO string
      createdBy: user.uid,
    }
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, {
        movements: arrayUnion(movement),
      })
      // Limpiar campos
      setMovementAmount(0)
      setMovementConcept('')
      setMovementDescription('')
      setMovementMethod('efectivo')
      setMovementCategory('venta')
      // Recalcular y actualizar los ingresos por ventas diarias si es una entrada de 'venta'
      if (movement.type === 'entry' && movement.category === 'venta') {
        const updatedSalesRevenue = dailySalesRevenue + movement.amount
        setDailySalesRevenue(updatedSalesRevenue)
        await updateDoc(docRef, { dailySalesRevenue: updatedSalesRevenue })
      }
    } catch (error) {
      console.error('Error al guardar movimiento:', error)
      alert('Error al guardar movimiento')
    }
  }

  const handleRemoveMovement = async (mov: Movement) => {
    if (!user) return
    if (registerData.status === 'closed') {
      alert('Día cerrado, no se pueden eliminar movimientos.')
      return
    }
    const confirmDelete = confirm(`¿Eliminar movimiento: "${mov.concept}" por ${mov.amount} COP?`)
    if (!confirmDelete) return
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, {
        movements: arrayRemove(mov),
      })
      // Recalcular y actualizar los ingresos por ventas diarias si se elimina una entrada de 'venta'
      if (mov.type === 'entry' && mov.category === 'venta') {
        const updatedSalesRevenue = dailySalesRevenue - mov.amount
        setDailySalesRevenue(updatedSalesRevenue)
        await updateDoc(docRef, { dailySalesRevenue: updatedSalesRevenue })
      }
    } catch (error) {
      console.error('Error al eliminar movimiento:', error)
      alert('Error al eliminar movimiento')
    }
  }

  const handleCloseDay = async () => {
    if (!user) return
    if (registerData.status === 'closed') {
      alert('Este día ya está cerrado.')
      return
    }
    const discrepancy = realClosingAmount - expectedClose // Corrección en el cálculo de discrepancia
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, {
        closingAmount,
        realClosingAmount,
        discrepancy,
        status: 'closed',
        closedBy: user.uid,
        savings: savingsAmount, // Guarda el ahorro al cerrar el día
      })
      alert('Día cerrado con éxito.')
      navigate('/contabilidad')
    } catch (error) {
      console.error('Error al cerrar el día:', error)
      alert('Error al cerrar el día')
    }
  }

  const handleUpdateBaseAmount = async () => {
    if (!user || !registerData) return
    if (registerData.status === 'closed') {
      alert('No puedes modificar la base después de cerrar el día.')
      return
    }
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, { baseAmount: baseAmount })
      alert('Base diaria actualizada.')
    } catch (error) {
      console.error('Error al actualizar la base diaria:', error)
      alert('Error al actualizar la base diaria.')
    }
  }

  const handleUpdateDailyStaffPayments = async () => {
    if (!user || !registerData) return
    if (registerData.status === 'closed') {
      alert('No puedes modificar los pagos al personal después de cerrar el día.')
      return
    }
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, { dailyStaffPayments: dailyStaffPayments })
      alert('Pagos diarios al personal actualizados.')
    } catch (error) {
      console.error('Error al actualizar los pagos diarios al personal:', error)
      alert('Error al actualizar los pagos diarios al personal.')
    }
  }

  return (
    <MainLayout>
      <div className="p-4 max-w-5xl mx-auto">
        {' '}
        {/* Increased max-w for wider table */}
        <h1 className="text-2xl font-bold mb-4 text-center text-indigo-700">
          Detalle de Caja - {registerData.date}
        </h1>
        <div className="mb-6 bg-gray-100 p-4 rounded shadow">
          <p>
            <strong>Estado:</strong>{' '}
            <span className={registerData.status === 'open' ? 'text-green-600' : 'text-gray-600'}>
              {registerData.status.toUpperCase()}
            </span>
          </p>
          <p>
            <strong>Apertura:</strong> {formatPriceCOP(registerData.openingAmount)}
          </p>
          <p>
            <strong>Ventas del día (registradas):</strong> {formatPriceCOP(dailySalesRevenue)}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Diaria</label>
            <div className="flex items-center">
              <CurrencyInput
                value={baseAmount}
                onChange={setBaseAmount}
                placeholder="Base diaria"
              />
              {registerData.status === 'open' && (
                <button
                  onClick={handleUpdateBaseAmount}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                >
                  Actualizar Base
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pagos diarios personal
            </label>
            <div className="flex items-center">
              <CurrencyInput
                value={dailyStaffPayments}
                onChange={setDailyStaffPayments}
                placeholder="Pagos personal"
              />
              {registerData.status === 'open' && (
                <button
                  onClick={handleUpdateDailyStaffPayments}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                >
                  Actualizar Pagos
                </button>
              )}
            </div>
          </div>
          <p>
            <strong>Ahorro del día (estimado):</strong> {formatPriceCOP(savingsAmount)}
          </p>
          <p>
            <strong>Entradas (Movimientos):</strong> {formatPriceCOP(totalEntries)}
          </p>
          <p>
            <strong>Salidas (Movimientos):</strong> {formatPriceCOP(totalExits)}
          </p>
          <p>
            <strong>Ingresos Esperados (Pedidos):</strong> {formatPriceCOP(expectedOrdersIncome)}{' '}
            {/* Mostrar ingresos esperados de pedidos */}
          </p>
          <p>
            <strong className="text-indigo-700">Cierre Esperado:</strong>{' '}
            {formatPriceCOP(expectedClose)}
          </p>
          {registerData.status === 'closed' && (
            <>
              <p>
                <strong>Declarado al Cerrar:</strong>{' '}
                {formatPriceCOP(registerData.closingAmount || 0)}
              </p>
              <p>
                <strong>Efectivo Real Contado:</strong>{' '}
                {formatPriceCOP(registerData.realClosingAmount || 0)}
              </p>
              <p>
                <strong>Discrepancia:</strong>{' '}
                <span
                  className={
                    registerData.discrepancy === 0
                      ? 'text-green-600 font-medium'
                      : 'text-red-600 font-medium'
                  }
                >
                  {registerData.discrepancy === 0
                    ? 'Todo cuadra'
                    : `${formatPriceCOP(registerData.discrepancy || 0)} (Sobrante/Pérdida)`}
                </span>
              </p>
              <p>
                <strong>Ahorro del día (cerrado):</strong>{' '}
                {formatPriceCOP(registerData.savings || 0)}
              </p>
            </>
          )}
        </div>
        {/* Tabla de Entradas y Salidas Esperadas */}
        <div className="mt-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Detalle de Entradas y Salidas</h2>
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2">Pedido / Movimiento</th>
                <th className="border border-gray-200 px-4 py-2">Tipo</th>
                <th className="border border-gray-200 px-4 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {/* Pedidos del Día */}
              {ordersOfTheDay.length > 0 ? (
                ordersOfTheDay.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-100">
                    <td className="border border-gray-200 px-4 py-2">
                      Pedido No. {order.orderId.substring(0, 8)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">Entrada Esperada (Pedido)</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {formatPriceCOP(order.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-gray-200 px-4 py-2 text-center italic" colSpan={3}>
                    No hay pedidos para este día
                  </td>
                </tr>
              )}
              {/* Movimientos Registrados */}
              {registerData.movements.map((mov) => (
                <tr key={mov.movementId} className="hover:bg-gray-100">
                  <td className="border border-gray-200 px-4 py-2">{mov.concept}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {mov.type === 'entry' ? 'Entrada' : 'Salida'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{formatPriceCOP(mov.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold">
              <tr>
                <td className="border border-gray-200 px-4 py-2">Totales Esperados</td>
                <td className="border border-gray-200 px-4 py-2"></td>
                <td className="border border-gray-200 px-4 py-2">
                  {formatPriceCOP(expectedClose)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Sección para registrar un movimiento */}
        {registerData.status === 'open' && (
          <div className="mb-6 p-4 border rounded bg-gray-50 shadow-sm">
            <h3 className="font-semibold mb-2 text-indigo-600">Registrar Movimiento</h3>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Tipo</label>
              <select
                className="border p-2 w-full rounded"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as 'entry' | 'exit')}
              >
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Monto</label>
              <CurrencyInput
                value={movementAmount}
                onChange={setMovementAmount}
                placeholder="Ej: 10.000"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Concepto</label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                value={movementConcept}
                onChange={(e) => setMovementConcept(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Categoría</label>
              <select
                className="border p-2 w-full rounded"
                value={movementCategory}
                onChange={(e) => setMovementCategory(e.target.value)}
              >
                {['venta', 'nomina', 'compra_insumos', 'pago_servicios', 'otros'].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Método de Pago</label>
              <select
                className="border p-2 w-full rounded"
                value={movementMethod}
                onChange={(e) => setMovementMethod(e.target.value)}
              >
                {['efectivo', 'transferencia', 'tarjeta'].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddMovement}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Agregar Movimiento
            </button>
          </div>
        )}
        {/* Sección para cerrar el día */}
        {registerData.status === 'open' && (
          <div className="mb-6 p-4 border rounded bg-gray-50 shadow-sm">
            <h3 className="font-semibold mb-2 text-indigo-600">Cerrar Día</h3>
            <div className="mb-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Cierre Declarado (opcional)
                </label>
                <CurrencyInput
                  value={closingAmount}
                  onChange={setClosingAmount}
                  placeholder="Ej: 50.000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Efectivo Real Contado</label>
                <CurrencyInput
                  value={realClosingAmount}
                  onChange={setRealClosingAmount}
                  placeholder="Ej: 50.000"
                />
              </div>
            </div>
            <button
              onClick={handleCloseDay}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Cerrar Día
            </button>
          </div>
        )}
        {/* Listado de movimientos */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Movimientos Registrados</h2>
          {registerData.movements.length === 0 ? (
            <p className="text-gray-500 text-center">No hay movimientos aún.</p>
          ) : (
            <ul className="space-y-3">
              {registerData.movements.map((mov) => (
                <li
                  key={mov.movementId}
                  className="bg-white border p-3 rounded flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div>
                    <p>
                      {mov.type === 'entry' ? (
                        <span className="text-green-600 font-medium">
                          +{formatPriceCOP(mov.amount)}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          -{formatPriceCOP(mov.amount)}
                        </span>
                      )}{' '}
                      - {mov.concept}
                    </p>
                    <p className="text-gray-600 text-xs">
                      <strong>Categoría:</strong> {mov.category} | <strong>Método:</strong>{' '}
                      {mov.method}
                    </p>
                    {mov.description && (
                      <p className="text-gray-500 text-sm mt-1">{mov.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(mov.createdAt).toLocaleString()} | Creado por: {mov.createdBy}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMovement(mov)}
                    className="text-red-500 hover:text-red-700 ml-2 text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-.478 0l-.345-9m7.021-2.01C18.692 6.905 17.127 5.536 15.313 5.536H8.687C6.873 5.536 5.308 6.905 5.308 8.72v.81c0 1.18.914 2.12 2.094 2.201l1.652.072m7.324 0l1.652-.072a2.094 2.094 0 002.094-2.201v-.81c0-1.814-1.365-3.183-3.187-3.183zm-2.961 8.903L15.7 11.855m-2.606 5.15l-2.796-5.15m5.136 0l-2.794 5.15z"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default ContabilidadDetail
