/* src\components\menu\partials\PersonOrder.tsx */
import React from "react";
import { MenuItem as MenuItemType } from "../../../context/AppContext";

interface PersonOrderProps {
  person: {
    id: string;
    name: string;
    items: { id: string; quantity: number }[];
  };
  index: number;
  menuCategories: { [category: string]: MenuItemType[] };
  menu: MenuItemType[];
  onAddItemToPerson: (personId: string, item: MenuItemType) => void;
  onPersonOrderItemQuantityChange: (
    personId: string,
    itemId: string,
    quantity: number
  ) => void;
  onRemoveItemFromPerson: (personId: string, itemId: string) => void;
  calculateSubtotal: (
    personItems: { id: string; quantity: number }[]
  ) => number;
  personOrderSummaryRef: React.RefObject<HTMLDivElement>;
  activeTab: string;
}

const PersonOrder: React.FC<PersonOrderProps> = ({
  person,
  index,
  menuCategories,
  menu,
  onAddItemToPerson,
  onPersonOrderItemQuantityChange,
  onRemoveItemFromPerson,
  calculateSubtotal,
  personOrderSummaryRef,
}) => {
  return (
    <div key={person.id} className="mb-8" ref={personOrderSummaryRef}>
      <div className="sticky top-16 bg-white p-4 shadow-md z-20 rounded-md transition-transform duration-200 ease-out transform translate-y-0 hover:translate-y-[-2px] ring-2 ring-indigo-500 ring-opacity-50 hover:ring-opacity-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Pedido de {person.name || `Persona ${index + 1}`} 😋
        </h2>
        <ul className="mb-4">
          {person.items.map((it) => {
            const menuItem = menu.find((m) => m.id === it.id);
            return menuItem ? (
              <li
                key={it.id}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <span className="flex-1 min-w-0">{menuItem.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      onPersonOrderItemQuantityChange(
                        person.id,
                        it.id,
                        it.quantity - 1
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{it.quantity}</span>
                  <button
                    onClick={() =>
                      onPersonOrderItemQuantityChange(
                        person.id,
                        it.id,
                        it.quantity + 1
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveItemFromPerson(person.id, it.id)}
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
                  ${(menuItem.price * it.quantity).toFixed(2)}
                </span>
              </li>
            ) : null;
          })}
          {person.items.length > 0 && (
            <li className="font-semibold text-right mt-2">
              Subtotal:{" "}
              <span className="text-indigo-700">
                ${calculateSubtotal(person.items).toFixed(2)}
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      ? () => onAddItemToPerson(person.id, item)
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

export default PersonOrder;
