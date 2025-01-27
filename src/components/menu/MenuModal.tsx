
import React from "react";
import { MenuItem } from "../../context/AppContext";
import MenuFormComponent from "./MenuForm";

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<MenuItem>;
  onSubmit: (values: Partial<MenuItem>) => void;
}

const MenuModal: React.FC<MenuModalProps> = ({
  open,
  onClose,
  initialValues,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      {" "}
      {/* Overlay y contenedor modal */}
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {" "}
        {/* Centrado vertical y horizontal */}
        {/* Modal panel */}
        <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform transition-all sm:w-full sm:mx-auto">
          {" "}
          {/* Panel modal */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            {" "}
            {/* Header modal */}
            <h3
              className="text-lg font-semibold text-gray-900"
              id="modal-headline"
            >
              {initialValues?.id
                ? "Editar Item del Menú"
                : "Agregar Nuevo Item al Menú"}
            </h3>
          </div>
          <div className="p-6">
            {" "}
            {/* Body modal */}
            <MenuFormComponent
              initialValues={initialValues}
              onSubmit={onSubmit}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
