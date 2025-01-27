/* src\components\menu\partials\SharedOrder.tsx */
import React from "react";
import { MenuItem as MenuItemType } from "../../../context/AppContext";

interface SharedOrderProps {
  menuCategories: { [category: string]: MenuItemType[] };
  sharedOrderItems: { itemId: string; quantity: number; personIds: string[] }[];
  onAddToSharedOrder: (item: MenuItemType) => void;
  onSharedOrderItemQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveSharedOrderItem: (itemId: string) => void;
  calculateSharedSubtotal: () => number;
  sharedOrderSummaryRef: React.RefObject<HTMLDivElement>;
  activeTab: string;
  menu: MenuItemType[];
}

const SharedOrder: React.FC<SharedOrderProps> = ({
  menuCategories,
  sharedOrderItems,
  onAddToSharedOrder,
  onSharedOrderItemQuantityChange,
  onRemoveSharedOrderItem,
  calculateSharedSubtotal,
  sharedOrderSummaryRef,

  menu,
}) => {
  return (
    <div className="mb-8">
      <div
        className="sticky top-16 bg-white p-4 shadow-md z-20 rounded-md transition-transform duration-200 ease-out transform translate-y-0 hover:translate-y-[-2px] ring-2 ring-indigo-500 ring-opacity-50 hover:ring-opacity-100"
        ref={sharedOrderSummaryRef}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Pedido para Compartir 🤝
        </h2>
        <ul className="mb-4">
          {sharedOrderItems.map((sharedItem) => {
            const menuItem = menu.find((m) => m.id === sharedItem.itemId);
            return menuItem ? (
              <li
                key={sharedItem.itemId}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <span className="flex-1 min-w-0">{menuItem.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      onSharedOrderItemQuantityChange(
                        sharedItem.itemId,
                        sharedItem.quantity - 1
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{sharedItem.quantity}</span>
                  <button
                    onClick={() =>
                      onSharedOrderItemQuantityChange(
                        sharedItem.itemId,
                        sharedItem.quantity + 1
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveSharedOrderItem(sharedItem.itemId)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
                </div>
                <span className="w-12 text-right">
                  ${(menuItem.price * sharedItem.quantity).toFixed(2)}
                </span>
              </li>
            ) : null;
          })}
          {sharedOrderItems.length > 0 && (
            <li className="font-semibold text-right mt-2">
              Subtotal:{" "}
              <span className="text-indigo-700">
                ${calculateSharedSubtotal().toFixed(2)}
              </span>
            </li>
          )}
        </ul>
      </div>
      <p className="text-gray-600 mb-4 text-center mt-4">
        ¿Algo más para compartir? ¡Elige del menú!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {Object.entries(menuCategories).map(([categoryName, items]) => (
          <div
            key={categoryName}
            className="transition-all duration-300 transform hover:scale-105"
          >
            <h3 className="font-bold text-lg text-gray-900 mb-2 text-indigo-500">
              {categoryName}
            </h3>
            <div className="flex flex-col space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  disabled={item.availabilityStatus !== "disponible"}
                  className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-left transition-colors duration-300 ${
                    item.availabilityStatus !== "disponible"
                      ? "opacity-50 cursor-not-allowed line-through pointer-events-none"
                      : ""
                  }`}
                  onClick={
                    item.availabilityStatus === "disponible"
                      ? () => onAddToSharedOrder(item)
                      : undefined
                  }
                >
                  {item.name} - ${item.price}
                  {item.availabilityStatus === "noDisponibleMomento" && (
                    <span className="ml-2 text-yellow-500 font-normal italic">
                      (No disponible ahora)
                    </span>
                  )}
                  {item.availabilityStatus === "noDisponibleLargoPlazo" && (
                    <span className="ml-2 text-red-500 font-normal italic">
                      (Ya no disponible)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedOrder;
