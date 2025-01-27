/* Inicio src\components\menu\MenuItem.tsx */
import React from "react";
import { MenuItem as MenuItemType } from "../../context/AppContext";

interface MenuItemProps {
  item: MenuItemType;
  onEdit: (item: MenuItemType) => void;
  onDelete: (item: MenuItemType) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onEdit, onDelete }) => {
  // Función para determinar el color del badge según el estado de disponibilidad
  const getStatusBadgeClass = () => {
    switch (item.availabilityStatus) {
      case "noDisponibleMomento":
        return "bg-yellow-500 text-yellow-900"; // Amarillo para "No disponible por el momento"
      case "noDisponibleLargoPlazo":
        return "bg-red-500 text-red-900"; // Rojo para "No disponible a largo plazo"
      default:
        return "bg-green-500 text-green-900"; // Verde para "Disponible"
    }
  };

  const statusBadgeClass = `inline-block ${getStatusBadgeClass()} rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2`;

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      {" "}
      {/* Card principal con Tailwind */}
      <img className="w-full" src={item.imageUrl} alt={item.name} />{" "}
      {/* Imagen responsive */}
      <div className="px-6 py-4">
        {" "}
        {/* Contenido principal card */}
        <div className="font-bold text-xl mb-2 flex justify-between items-center">
          {item.name}
          <span className={statusBadgeClass}>
            {item.availabilityStatus === "disponible"
              ? "Disponible"
              : item.availabilityStatus === "noDisponibleMomento"
              ? "No Disponible Ahora"
              : "No Disponible"}
          </span>
        </div>{" "}
        {/* Nombre del item */}
        <p className="text-gray-700 text-base">{item.description}</p>{" "}
        {/* Descripción */}
        <p className="text-gray-700 text-lg mt-2">Precio: ${item.price}</p>{" "}
        {/* Precio */}
        <div>
          {item.recommendation && (
            <p className="text-gray-600 text-sm mt-1">
              Recomendaciones: {item.recommendation}
            </p>
          )}
          {item.observations && (
            <p className="text-gray-600 text-sm mt-1">
              Observaciones: {item.observations}
            </p>
          )}
        </div>
      </div>
      <div className="px-6 py-4 flex justify-end space-x-2">
        {" "}
        {/* Contenedor acciones */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => onEdit(item)}
        >
          Editar
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => onDelete(item)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default MenuItem;
