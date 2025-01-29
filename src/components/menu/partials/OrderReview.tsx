/* src/components/menu/partials/OrderReview.tsx */
import { Typography } from '@mui/material'
import React from 'react'
import { MenuItem as MenuItemType } from '../../../context/AppContext'
import PedidoForm from '../../forms/PedidoForm'
import { Person, SharedOrderItem } from '../GroupOrderPage'

interface OrderReviewProps {
  people: Person[]
  sharedOrderItems: SharedOrderItem[]
  menu: MenuItemType[]
  onClosePedidoForm: () => void
  calculateSharedSubtotal: () => number
  calculateSubtotal: (personItems: { id: string; quantity: number }[]) => number
  isOrderOwner: boolean
  onOrderPlaced: () => void
  orderPlaced: boolean
  showPricesToAll?: boolean
  onToggleShowPrices: () => void
}

const OrderReview: React.FC<OrderReviewProps> = ({
  people,
  sharedOrderItems,
  menu,
  onClosePedidoForm,
  calculateSharedSubtotal,
  calculateSubtotal,
  isOrderOwner,
  onOrderPlaced,
  orderPlaced,
  showPricesToAll = false,
  onToggleShowPrices,
}) => {
  // Formatear a moneda
  const formatPriceCOP = (price: number) => {
    return price.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  // Calculamos totales usando las funciones pasadas por props
  const totalShared = calculateSharedSubtotal()
  const totalIndividuals = people.reduce((sum, person) => {
    return sum + calculateSubtotal(person.items)
  }, 0)
  const totalOrderAmount = totalShared + totalIndividuals

  // Quién ve los precios
  const canViewPrices = isOrderOwner || showPricesToAll

  const handlePedidoFormClose = () => {
    onClosePedidoForm()
    onOrderPlaced() // Indica que se confirmó el pedido
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        Revisión Detallada del Pedido Grupal 🧐
      </h2>

      {/* Toggle para mostrar/ocultar precios al resto, solo si orderPlaced y soy owner */}
      {isOrderOwner && orderPlaced && (
        <div className="flex justify-center mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={showPricesToAll}
              onChange={onToggleShowPrices}
            />
            <span className="ml-2 text-gray-800">Mostrar Precios a Todos</span>
          </label>
        </div>
      )}

      {/* Items Compartidos */}
      {sharedOrderItems && sharedOrderItems.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
            Detalle del Pedido Compartido 🤝
          </h3>
          <ul>
            {sharedOrderItems.map((sharedItem) => {
              const menuItem = menu.find((m) => m.id === sharedItem.itemId)
              if (!menuItem) return null
              const itemTotal = menuItem.price * sharedItem.quantity
              return (
                <li key={sharedItem.itemId} className="py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2">{menuItem.name}</span>
                    <span className="text-sm text-gray-500">x {sharedItem.quantity}</span>
                  </div>
                  {canViewPrices && (
                    <span className="w-12 text-right">{formatPriceCOP(itemTotal)}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {canViewPrices && (
            <div className="font-semibold text-right mt-2">
              Subtotal Compartido:
              <span className="text-indigo-700 ml-1">{formatPriceCOP(totalShared)}</span>
            </div>
          )}
        </div>
      )}

      {/* Items de cada persona */}
      {people.map((person) => {
        const personSubtotal = calculateSubtotal(person.items)
        return (
          <div key={person.personIndex} className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
              Detalle del Pedido Individual - {person.name} 👤
            </h3>
            <ul>
              {person.items.map((it) => {
                const menuItem = menu.find((m) => m.id === it.id)
                if (!menuItem) return null
                const itemTotal = menuItem.price * it.quantity
                return (
                  <li key={it.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">{menuItem.name}</span>
                      <span className="text-sm text-gray-500">x {it.quantity}</span>
                    </div>
                    {canViewPrices && (
                      <span className="w-12 text-right">{formatPriceCOP(itemTotal)}</span>
                    )}
                  </li>
                )
              })}
            </ul>
            {canViewPrices && (
              <div className="font-semibold text-right mt-2">
                Subtotal Individual:
                <span className="text-indigo-700 ml-1">{formatPriceCOP(personSubtotal)}</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Totales finales */}
      {canViewPrices && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 text-indigo-600 text-center">
            Resumen del Pedido Grupal Completo 💰
          </h3>
          <div className="flex justify-between items-center">
            <div className="font-semibold text-gray-700">
              <Typography>Subtotal Compartido:</Typography>
              {people.map((person) => (
                <Typography key={person.personIndex}>Subtotal {person.name}:</Typography>
              ))}
              <Typography className="font-bold mt-2">Total del Pedido:</Typography>
            </div>
            <div className="text-right font-semibold text-xl text-indigo-700">
              <Typography>{formatPriceCOP(totalShared)}</Typography>
              {people.map((person) => (
                <Typography key={person.personIndex}>
                  {formatPriceCOP(calculateSubtotal(person.items))}
                </Typography>
              ))}
              <Typography className="font-bold mt-2">{formatPriceCOP(totalOrderAmount)}</Typography>
            </div>
          </div>
        </div>
      )}

      {/* Si no se ha colocado el pedido, renderizar el form */}
      {!orderPlaced && (
        <PedidoForm
          onClose={handlePedidoFormClose}
          people={people}
          sharedOrderItems={sharedOrderItems}
        />
      )}
      {orderPlaced && (
        <div className="text-center mt-6">
          <Typography variant="h6" className="text-green-600">
            ¡Pedido realizado con éxito!
          </Typography>
        </div>
      )}
    </div>
  )
}

export default OrderReview
