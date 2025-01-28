/* Inicio src\components\forms\MenuForm.tsx */
/* src\components\forms\MenuForm.tsx */
import React, { useState } from "react";
import { MenuItem } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";

interface MenuFormProps {
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: Partial<MenuItem>) => void;
  onClose: () => void; // Add onClose prop
}

const MenuForm: React.FC<MenuFormProps> = ({
  initialValues,
  onSubmit,
  onClose,
}) => {
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
  // Nueva estado para el estado de disponibilidad
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "disponible" | "noDisponibleMomento" | "noDisponibleLargoPlazo"
  >(initialValues?.availabilityStatus || "disponible");

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
      availabilityStatus, // Incluir el nuevo estado en los valores enviados
    });
    onClose(); // Close modal on submit
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {" "}
      {/* Formulario con espaciado vertical */}
      <div className="grid grid-cols-1 gap-4">
        {" "}
        {/* Grid para los campos */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre del Item
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Descripción
          </label>
          <textarea /* Usamos textarea para la descripción */
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Precio
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-700"
          >
            URL de Imagen
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="recommendation"
            className="block text-sm font-medium text-gray-700"
          >
            Recomendaciones (Opcional)
          </label>
          <input
            type="text"
            id="recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="observations"
            className="block text-sm font-medium text-gray-700"
          >
            Observaciones (Opcional)
          </label>
          <input
            type="text"
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        {/* Nuevo campo para el estado de disponibilidad */}
        <div>
          <label
            htmlFor="availabilityStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Estado de Disponibilidad
          </label>
          <select
            id="availabilityStatus"
            value={availabilityStatus}
            onChange={(e) =>
              setAvailabilityStatus(
                e.target.value as
                  | "disponible"
                  | "noDisponibleMomento"
                  | "noDisponibleLargoPlazo"
              )
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="disponible">Disponible</option>
            <option value="noDisponibleMomento">
              No disponible en el momento
            </option>
            <option value="noDisponibleLargoPlazo">Ya no disponible</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        {" "}
        {/* Contenedor para checkbox y botones */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          <label htmlFor="available" className="ml-2 text-sm text-gray-700">
            Disponible (Visible en Menu)
          </label>
        </div>
        <div className="space-x-2">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={onClose}
            type="button" /* Importante: type="button" para evitar submit del form al cancelar */
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {initialValues?.id ? "Guardar" : "Agregar"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default MenuForm;
