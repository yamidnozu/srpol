// src/pages/ContabilidadDetail.tsx
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { db } from '../utils/firebase'

interface Movement {
  movementId: string
  type: 'entry' | 'exit'
  amount: number
  concept: string
  description?: string
  category: string
  method: string
  createdAt: any
  createdBy: string
}

interface DailyCashRegister {
  id: string
  date: string
  openingAmount: number
  closingAmount?: number
  realClosingAmount?: number
  discrepancy?: number
  status: 'open' | 'closed'
  createdBy: string
  closedBy?: string
  movements: Movement[]
}

const ContabilidadDetail: React.FC = () => {
  const { user, userRole } = useAuth()
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [registerData, setRegisterData] = useState<DailyCashRegister | null>(null)
  const [loading, setLoading] = useState(true)

  // Nuevos estados para registrar un movimiento
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry')
  const [movementAmount, setMovementAmount] = useState<number>(0)
  const [movementConcept, setMovementConcept] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [movementCategory, setMovementCategory] = useState('venta') // Default to 'ventas'
  const [movementMethod, setMovementMethod] = useState('efectivo') // Default to 'efectivo'

  // Campos para cerrar el día
  const [closingAmount, setClosingAmount] = useState<number>(0)
  const [realClosingAmount, setRealClosingAmount] = useState<number>(0)

  useEffect(() => {
    if (!params.id) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'caja', params.id)
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false)
        return
      }
      const data = snapshot.data() as Omit<DailyCashRegister, 'id'>
      setRegisterData({
        id: snapshot.id,
        ...data,
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [params.id])

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4">Cargando detalle...</div>
      </MainLayout>
    )
  }

  if (!registerData) {
    return (
      <MainLayout>
        <div className="p-4">No se encontró el registro de caja.</div>
      </MainLayout>
    )
  }

  // Calcular totales al vuelo:
  const totalEntries = registerData.movements
    .filter((m) => m.type === 'entry')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const totalExits = registerData.movements
    .filter((m) => m.type === 'exit')
    .reduce((acc, cur) => acc + cur.amount, 0)

  const expectedClose = registerData.openingAmount + totalEntries - totalExits

  const handleAddMovement = async () => {
    if (!user) return
    if (registerData.status === 'closed') {
      alert('Día cerrado, no se pueden agregar movimientos.')
      return
    }

    // Crear un Movement
    const movement: Movement = {
      movementId: crypto.randomUUID(),
      type: movementType,
      amount: movementAmount,
      concept: movementConcept.trim() || 'Sin concepto',
      description: movementDescription.trim(),
      category: movementCategory,
      method: movementMethod,
      createdAt: new Date(),
      createdBy: user.uid,
    }
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, {
        movements: arrayUnion(movement),
      })
      // Limpiar formulario
      setMovementAmount(0)
      setMovementConcept('')
      setMovementDescription('')
      setMovementMethod('efectivo')
      setMovementCategory('venta')
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
    // Cálculo
    const discrepancy = expectedClose - realClosingAmount
    try {
      const docRef = doc(db, 'caja', registerData.id)
      await updateDoc(docRef, {
        closingAmount,
        realClosingAmount,
        discrepancy,
        status: 'closed',
        closedBy: user.uid,
      })
      alert('Día cerrado con éxito.')
      navigate('/contabilidad')
    } catch (error) {
      console.error('Error al cerrar el día:', error)
      alert('Error al cerrar el día')
    }
  }

  // Function to format price to Colombian Pesos
  const formatPriceCOP = (price: number) => {
    return price.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const categories = ['venta', 'compra_insumos', 'pago_servicios', 'nomina', 'otros']

  const paymentMethods = ['efectivo', 'transferencia', 'tarjeta']

  const groupedMovements = registerData.movements.reduce(
    (acc, mov) => {
      acc[mov.category] = acc[mov.category] || []
      acc[mov.category].push(mov)
      return acc
    },
    {} as Record<string, Movement[]>,
  )

  const calculateCategoryTotal = (category: string, type: 'entry' | 'exit') => {
    return (groupedMovements[category] || [])
      .filter((m) => m.type === type)
      .reduce((sum, m) => sum + m.amount, 0)
  }

  return (
    <MainLayout>
      <div className="p-4">
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
            <strong>Entradas:</strong> {formatPriceCOP(totalEntries)}
          </p>
          <p>
            <strong>Salidas:</strong> {formatPriceCOP(totalExits)}
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
            </>
          )}
        </div>
        {/* Resumen por categoría */}
        {Object.keys(groupedMovements).length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-indigo-600">Resumen por Categoría</h2>
            {Object.keys(groupedMovements).map((category) => (
              <div key={category} className="p-3 bg-white border rounded shadow-sm mb-2">
                <h3 className="text-lg font-medium text-gray-800 capitalize">{category}</h3>
                <div className="ml-4">
                  <p className="text-sm text-gray-700">
                    <strong>Ingresos:</strong>{' '}
                    {formatPriceCOP(calculateCategoryTotal(category, 'entry'))}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Egresos:</strong>{' '}
                    {formatPriceCOP(calculateCategoryTotal(category, 'exit'))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Movimientos */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600">Movimientos</h2>
          {registerData.movements.length === 0 && (
            <p className="text-gray-400 text-center">No hay movimientos aún.</p>
          )}
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
                    <strong>Categoria:</strong> {mov.category} <strong>Metodo:</strong> {mov.method}
                  </p>
                  {mov.description && (
                    <p className="text-gray-500 text-sm mt-1">{mov.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(mov.createdAt).toLocaleString()} | Creado por: {mov.createdBy}
                  </p>
                </div>
                {registerData.status === 'open' &&
                  (userRole === 'admin' || userRole === 'encargado') && (
                    <button
                      onClick={() => handleRemoveMovement(mov)}
                      className="text-red-500 hover:text-red-700 ml-2 text-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 h-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M14.74 9l-.346 9m-.478 0l-.345-9m7.021-2.01C18.692 6.905 17.127 5.536 15.313 5.536H8.687C6.873 5.536 5.308 6.905 5.308 8.72v.81c0 1.18.914 2.12 2.094 2.201l1.652.072m7.324 0l1.652-.072a2.094 2.094 0 002.094-2.201v-.81c0-1.814-1.365-3.183-3.187-3.183zm-2.961 8.903L15.7 11.855m-2.606 5.15l-2.796-5.15m5.136 0l-2.794 5.15z"
                        />
                      </svg>
                    </button>
                  )}
              </li>
            ))}
          </ul>
        </div>

        {/* Formulario para añadir movimiento (solo si día abierto) */}
        {registerData.status === 'open' && (userRole === 'admin' || userRole === 'encargado') && (
          <div className="mb-8 p-4 border rounded bg-gray-50 shadow-sm">
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
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={movementAmount}
                onChange={(e) => setMovementAmount(Number(e.target.value))}
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
              <label className="block text-sm text-gray-700 mb-1">Categoria</label>
              <select
                className="border p-2 w-full rounded"
                value={movementCategory}
                onChange={(e) => setMovementCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Metodo de Pago</label>
              <select
                className="border p-2 w-full rounded"
                value={movementMethod}
                onChange={(e) => setMovementMethod(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddMovement}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Agregar Movimiento
            </button>
          </div>
        )}

        {/* Cerrar día (si está abierto) */}
        {registerData.status === 'open' && (userRole === 'admin' || userRole === 'encargado') && (
          <div className="p-4 border rounded bg-gray-50 shadow-sm">
            <h3 className="font-semibold mb-2 text-indigo-600">Cerrar Día</h3>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">
                Cierre declarado (opcional)
              </label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={closingAmount}
                onChange={(e) => setClosingAmount(Number(e.target.value))}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Efectivo Real Contado</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={realClosingAmount}
                onChange={(e) => setRealClosingAmount(Number(e.target.value))}
              />
            </div>
            <button
              onClick={handleCloseDay}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Cerrar Día
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ContabilidadDetail
