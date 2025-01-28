/* Inicio src\components\menu\partials\OrderReview.tsx */
import { Typography } from "@mui/material";
import React from "react";
import { MenuItem as MenuItemType } from "../../../context/AppContext";
import PedidoForm from "../../forms/PedidoForm";
import { Person, SharedOrderItem } from "../GroupOrderPage"; // Import Person and SharedOrderItem interfaces

interface OrderReviewProps {
  people: Person[]; // Use the imported Person interface
  sharedOrderItems: SharedOrderItem[]; // Use the imported SharedOrderItem interface
  menu: MenuItemType[];
  onClosePedidoForm: () => void;
  calculateSharedSubtotal: () => number;
  calculateSubtotal: (
    personItems: { id: string; quantity: number }[]
  ) => number;
  isOrderOwner: boolean; // New prop to indicate if the viewer is the order owner
  onOrderPlaced: () => void; // Add callback for order placement
  orderPlaced: boolean; // Prop to determine if the order is already placed
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
  orderPlaced, // Destructure the new prop
}) => {
  // Calculate total order amount
  const totalOrderAmount =
    calculateSharedSubtotal() +
    people.reduce((sum, person) => sum + calculateSubtotal(person.items), 0);

  // Function to format price to Colombian Pesos
  const formatPriceCOP = (price: number) => {
    return price.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0, // Remove cents if whole number
      maximumFractionDigits: 0,
    });
  };

  const handlePedidoFormClose = () => {
    onClosePedidoForm();
    onOrderPlaced(); // Call the callback when PedidoForm is closed after submit
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        Revisión Detallada del Pedido Grupal 🧐
      </h2>

      {/* Shared Order Section */}
      {sharedOrderItems && sharedOrderItems.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
            Detalle del Pedido Compartido 🤝
          </h3>
          <ul>
            {sharedOrderItems.map((sharedItem) => {
              const menuItem = menu.find((m) => m.id === sharedItem.itemId);
              if (menuItem) {
                const itemTotalPrice = menuItem.price * sharedItem.quantity;
                return (
                  <li
                    key={sharedItem.itemId}
                    className="py-2 flex items-center justify-between" // Align items vertically and justify content
                  >
                    <div className="flex items-center">
                      {" "}
                      {/* Container for item name and quantity */}
                      <span className="mr-2">{menuItem.name}</span>
                      <span className="text-sm text-gray-500">
                        x {sharedItem.quantity}
                      </span>
                    </div>
                    {isOrderOwner && ( // Conditionally render price for owner
                      <span className="w-12 text-right">
                        {formatPriceCOP(itemTotalPrice)}
                      </span>
                    )}
                  </li>
                );
              } else {
                return null; // Handle case where menuItem is not found
              }
            })}
          </ul>
          {isOrderOwner && ( // Conditionally render subtotal for owner
            <div className="font-semibold text-right mt-2">
              Subtotal Compartido:
              <span className="text-indigo-700 ml-1">
                {formatPriceCOP(calculateSharedSubtotal())}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Individual Orders Section */}
      {people &&
        people.map((person) => (
          <div
            key={person.personIndex}
            className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
              Detalle del Pedido Individual - {person.name} 👤
            </h3>
            <ul>
              {person.items.map((it) => {
                const menuItem = menu.find((m) => m.id === it.id);
                if (menuItem) {
                  const itemTotalPrice = menuItem.price * it.quantity;
                  return (
                    <li
                      key={it.id}
                      className="py-2 flex items-center justify-between" // Align items vertically and justify content
                    >
                      <div className="flex items-center">
                        {" "}
                        {/* Container for item name and quantity */}
                        <span className="mr-2">{menuItem.name}</span>
                        <span className="text-sm text-gray-500">
                          x {it.quantity}
                        </span>
                      </div>
                      {isOrderOwner && ( // Conditionally render price for owner
                        <span className="w-12 text-right">
                          {formatPriceCOP(itemTotalPrice)}
                        </span>
                      )}
                    </li>
                  );
                } else {
                  return null; // Handle menu item not found case
                }
              })}
            </ul>
            {isOrderOwner && ( // Conditionally render subtotal for owner
              <div className="font-semibold text-right mt-2">
                Subtotal Individual:
                <span className="text-indigo-700 ml-1">
                  {formatPriceCOP(calculateSubtotal(person.items))}
                </span>
              </div>
            )}
          </div>
        ))}

      {/* Total Order Section */}
      {isOrderOwner && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-3 text-indigo-600 text-center">
            Resumen del Pedido Grupal Completo 💰
          </h3>
          <div className="flex justify-between items-center">
            {" "}
            {/* Flex container for labels and total */}
            <div className="font-semibold text-gray-700">
              {" "}
              {/* Left side labels container */}
              <Typography>Subtotal Compartido:</Typography>
              {people.map((person) => (
                <Typography key={person.personIndex}>
                  Subtotal {person.name}:
                </Typography>
              ))}
              <Typography className="font-bold mt-2">
                Total del Pedido:
              </Typography>
            </div>
            <div className="text-right font-semibold text-xl text-indigo-700">
              {" "}
              {/* Right side amounts container */}
              <Typography>
                {formatPriceCOP(calculateSharedSubtotal())}
              </Typography>
              {people.map((person) => (
                <Typography key={person.personIndex}>
                  {formatPriceCOP(calculateSubtotal(person.items))}
                </Typography>
              ))}
              <Typography className="font-bold mt-2">
                {formatPriceCOP(totalOrderAmount)}
              </Typography>
            </div>
          </div>
        </div>
      )}

      {!orderPlaced && ( // Conditionally render PedidoForm and button if order is not placed yet
        <PedidoForm
          onClose={handlePedidoFormClose} // Use the modified close handler
          people={people}
          sharedOrderItems={sharedOrderItems}
          groupOrderId={undefined} // Pass groupOrderId if available
        />
      )}
      {orderPlaced && (
        <div className="text-center mt-6">
          <Typography variant="h6" className="text-green-600">
            ¡Pedido realizado con éxito!
          </Typography>
          {/* Opcional: Mostrar un mensaje adicional o botón para volver al menú */}
        </div>
      )}
    </div>
  );
};

export default OrderReview;

/* Fin src\components\menu\partials\OrderReview.tsx */
