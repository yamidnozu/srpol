/* Inicio src\components\menu\MenuModal.tsx */
/* src\components\menu\MenuModal.tsx */

import React, { useState } from "react";
import { MenuItem } from "../../context/AppContext";

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<MenuItem>;
  onSubmit: (name: string) => void; // Change onSubmit prop type to accept name string
}

const MenuModal: React.FC<MenuModalProps> = ({
  open,
  onClose,
  initialValues,
  onSubmit,
}) => {
  const [name, setName] = useState(initialValues?.name || "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("NameModal - handleSubmit - Name being submitted:", name); // Debug log
    onSubmit(name); // Submit only the name string
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      {/* Overlay y contenedor modal */}
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Centrado vertical y horizontal */}
        {/* Modal panel */}
        <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform transition-all sm:w-full sm:mx-auto">
          {/* Panel modal */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            {/* Header modal */}
            <h3
              className="text-lg font-semibold text-gray-900"
              id="modal-headline"
            >
              Ingresa tu Nombre (Opcional)
            </h3>
          </div>
          <div className="p-6">
            {/* Body modal */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre:
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;

/* Fin src\components\menu\MenuModal.tsx */
