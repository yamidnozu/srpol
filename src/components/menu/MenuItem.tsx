/* src\components\menu\MenuItem.tsx */
import React from "react";
import { MenuItem as MenuItemType } from "../../context/AppContext";

interface MenuItemProps {
  item: MenuItemType;
  onEdit: (item: MenuItemType) => void;
  onDelete: (item: MenuItemType) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      {" "}
      {/* Card principal con Tailwind */}
      <img className="w-full" src={item.imageUrl} alt={item.name} />{" "}
      {/* Imagen responsive */}
      <div className="px-6 py-4">
        {" "}
        {/* Contenido principal card */}
        <div className="font-bold text-xl mb-2">{item.name}</div>{" "}
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
