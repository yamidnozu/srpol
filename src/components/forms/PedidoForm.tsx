// src/components/pedidos/PedidoForm.tsx
import { Timestamp, addDoc, collection } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../../hooks/useAuth'
import { useMenu } from '../../hooks/useMenu'
import { db } from '../../utils/firebase'

/** Mismo tipo que uses en GroupOrderPage */
interface Person {
  personIndex: number
  userId: string | null
  name: string
  items: { id: string; quantity: number }[]
  locked?: boolean
  finished?: boolean
}

interface SharedOrderItem {
  itemId: string
  quantity: number
  personIds: string[]
}

interface PedidoFormProps {
  onClose: () => void
  people?: Person[] // Aquí usamos la interface Person
  sharedOrderItems?: SharedOrderItem[]
}

const PedidoForm: React.FC<PedidoFormProps> = ({ onClose, people, sharedOrderItems }) => {
  const { menu } = useMenu()
  const { user, addPoints } = useAuth()
  const [items, setItems] = useState<
    {
      id: string
      quantity: number
      assignedTo: string
    }[]
  >([])

  const [peopleOrder, setPeopleOrder] = useState<{ userId: string | null; name: string }[]>([])
  const [sede, setSede] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryIncluded, setDeliveryIncluded] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('contraentrega')

  useEffect(() => {
    // Convertimos people en un estado con 'peopleOrder'
    if (people) {
      const mapped = people.map((p) => ({
        userId: p.userId,
        name: p.name,
      }))
      setPeopleOrder(mapped)

      // Flatten person items
      const personItems = people.flatMap((person) =>
        person.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          assignedTo: person.name,
        })),
      )
      setItems(personItems)
    }
  }, [people])

  useEffect(() => {
    if (sharedOrderItems) {
      // Flatten shared items -> assignedTo: 'Compartido'
      const sharedItemsForDisplay = sharedOrderItems.flatMap((sharedItem) =>
        Array(sharedItem.quantity)
          .fill(null)
          .map(() => ({
            id: sharedItem.itemId,
            quantity: 1,
            assignedTo: 'Compartido',
          })),
      )
      setItems((prev) => [...prev, ...sharedItemsForDisplay])
    }
  }, [sharedOrderItems])

  // Simulación sedes
  const sedesDisponibles = ['Sede Norte', 'Sede Sur', 'Sede Centro']
  useEffect(() => {
    if (sedesDisponibles.length === 1) {
      setSede(sedesDisponibles[0])
    }
  }, [sedesDisponibles])

  const calculateTotal = () => {
    let total = 0
    items.forEach((item) => {
      const menuItem = menu.find((m) => m.id === item.id)
      if (menuItem) {
        total += menuItem.price * item.quantity
      }
    })
    return total + deliveryFee
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return

    try {
      const total = calculateTotal()
      const orderId = uuidv4()
      const orderData = {
        userId: user.uid,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          assignedTo: item.assignedTo,
        })),
        people: peopleOrder,
        sede,
        status: 'pendiente',
        total,
        deliveryFee,
        deliveryIncluded,
        paymentMethod,
        orderDate: Timestamp.now(),
        orderId,
        sharedItems: sharedOrderItems
          ? sharedOrderItems.map((si) => ({
              itemId: si.itemId,
              quantity: si.quantity,
              personIds: si.personIds,
            }))
          : [],
      }

      await addDoc(collection(db, 'pedidos'), orderData)
      handlePaymentSuccess()
    } catch (error) {
      console.error('Error al agregar el pedido:', error)
    }
  }

  const handlePaymentSuccess = async () => {
    await addPoints()
    alert('Pedido realizado con éxito y puntos sumados.')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Realizar Pedido</h2>
      <div>
        <label htmlFor="sede" className="block text-sm font-medium text-gray-700">
          Sede
        </label>
        <select
          id="sede"
          value={sede}
          onChange={(e) => setSede(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {sedesDisponibles.map((sedeItem) => (
            <option key={sedeItem} value={sedeItem}>
              {sedeItem}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">
          Costo de Envío
        </label>
        <input
          type="number"
          id="deliveryFee"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(parseFloat(e.target.value))}
          required
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="deliveryIncluded"
            name="deliveryIncluded"
            type="checkbox"
            checked={deliveryIncluded}
            onChange={(e) => setDeliveryIncluded(e.target.checked)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>
        <div className="ml-2 text-sm">
          <label htmlFor="deliveryIncluded" className="font-medium text-gray-700">
            ¿El domicilio está incluido?
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
          Método de Pago
        </label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="contraentrega">Contraentrega</option>
        </select>
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Realizar Pedido1
        </button>
      </div>
    </form>
  )
}

export default PedidoForm
