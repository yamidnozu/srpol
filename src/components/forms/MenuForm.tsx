import React, { useState } from "react";
import { MenuItem } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";

interface MenuFormProps {
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: Partial<MenuItem>) => void;
}

const MenuForm: React.FC<MenuFormProps> = ({ initialValues, onSubmit }) => {
  const { loading } = useMenu();
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(
    initialValues?.description || ""
  );
  const [price, setPrice] = useState(initialValues?.price || 0);
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || "");
  const [recommendation, setRecommendation] = useState(
    initialValues?.recommendation || ""
  );
  const [observations, setObservations] = useState(
    initialValues?.observations || ""
  );
  const [available, setAvailable] = useState(
    initialValues?.available !== undefined ? initialValues.available : true
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      description,
      price,
      imageUrl,
      available,
      recommendation,
      observations,
    });
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {" "}
      {/* Reemplaza form y añade spacing vertical */}
      <h2 className="text-xl font-bold text-gray-900">
        {" "}
        {/* Reemplaza Typography h5 */}
        {initialValues?.id ? "Editar Item" : "Agregar Item"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {" "}
        {/* Reemplaza Grid container con grid y spacing */}
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre del Item
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Descripción del Item
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Precio del Item
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Url de la imagen
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="recommendation"
            className="block text-sm font-medium text-gray-700"
          >
            Recomendaciones
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="text"
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
        <div>
          {" "}
          {/* Reemplaza Grid item */}
          <label
            htmlFor="observations"
            className="block text-sm font-medium text-gray-700"
          >
            Observaciones
          </label>{" "}
          {/* Reemplaza TextField label */}
          <input
            type="text"
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Reemplaza TextField input
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-4">
        {" "}
        {/* Reemplaza FormControlLabel y Checkbox con div flex */}
        <input
          type="checkbox"
          id="available"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" // Reemplaza Checkbox input
        />
        <label
          htmlFor="available"
          className="block text-gray-700 text-sm font-bold"
        >
          Disponible
        </label>{" "}
        {/* Reemplaza FormControlLabel label */}
      </div>
      <div>
        {" "}
        {/* Reemplaza Grid item button container */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" // Reemplaza Button
        >
          {initialValues?.id ? "Guardar Cambios" : "Agregar Item"}
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
