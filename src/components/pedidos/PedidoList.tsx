/* Directorio: src\components\pedidos */
/* Inicio src\components\pedidos\PedidoList.tsx */
// src/components/pedidos/PedidoList.tsx
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMenu } from "../../hooks/useMenu"; // Import useMenu hook
import { COLLECTIONS } from "../../utils/constants";
import { db } from "../../utils/firebase";

interface Pedido {
  id: string;
  userId: string;
  items: { id: string; quantity: number; assignedTo: string }[];
  people: { id: string; name: string }[];
  sede: string;
  status: string;
  total: number;
  deliveryFee: number;
  deliveryIncluded: boolean;
  paymentMethod: string;
  orderDate: Date;
  orderId: string;
  sharedItems?: {
    itemId: string;
    quantity: number;
    personIds: string[];
  }[];
}

const PedidoList: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const { user, userRole } = useAuth();
  const { menu } = useMenu(); // Use useMenu hook to get menu data
  const [selectedStatus, setSelectedStatus] = useState("pendiente");
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedPedidoDetails, setSelectedPedidoDetails] =
    useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let pedidosQuery = query(collection(db, COLLECTIONS.PEDIDOS));

    if (userRole === "client") {
      pedidosQuery = query(
        collection(db, COLLECTIONS.PEDIDOS),
        where("userId", "==", user.uid)
      );
    } else if (userRole === "admin" || userRole === "encargado") {
      pedidosQuery = query(
        collection(db, COLLECTIONS.PEDIDOS),
        where("status", "==", selectedStatus)
      );
    }

    const unsubscribe = onSnapshot(pedidosQuery, (snapshot) => {
      const pedidosData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          items: data.items || [],
          people: data.people || [],
          sede: data.sede,
          status: data.status,
          total: data.total,
          deliveryFee: data.deliveryFee,
          deliveryIncluded: data.deliveryIncluded,
          paymentMethod: data.paymentMethod,
          orderDate: data.orderDate ? data.orderDate.toDate() : new Date(),
          orderId: data.orderId,
          sharedItems: data.sharedItems || [],
        } as Pedido;
      });
      setPedidos(pedidosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userRole, selectedStatus]);

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.PEDIDOS, orderId), {
        status: newStatus,
      });
    } catch (error) {
      console.error(
        "Error updating order status:",
        (error as { message: string }).message
      );
    }
  };

  const handleOpenDetails = (order: Pedido) => {
    setSelectedPedidoDetails(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedPedidoDetails(null);
    setOpenDetails(false);
  };

  // Function to format price to Colombian Pesos
  const formatPriceCOP = (price: number) => {
    if (typeof price === "number") {
      return price.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      return "N/A";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-200 text-yellow-800";
      case "atendiendo":
        return "bg-blue-200 text-blue-800";
      case "preparando":
        return "bg-orange-200 text-orange-800";
      case "enviado":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto my-8 p-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Lista de Pedidos
      </h2>

      {userRole !== "client" && (
        <div className="mb-6">
          <label
            htmlFor="status-filter"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Filtrar por estado:
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={handleStatusChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="pendiente">Pendiente</option>
            <option value="atendiendo">Atendiendo</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviado</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Orden No. {order.orderId.substring(0, 8)}
              </h3>
              <div className="flex items-center mb-2">
                <span className="text-gray-700 mr-2">Estado:</span>
                <span
                  className={`inline-block px-2 py-1 font-semibold text-sm rounded-full ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-gray-700 mb-2">Sede: {order.sede}</p>
              <p className="text-gray-700 mb-2">
                Fecha: {order.orderDate.toLocaleDateString()}{" "}
                {order.orderDate.toLocaleTimeString()}
              </p>
              <p className="text-gray-700 mb-3 font-semibold">
                Total: {formatPriceCOP(order.total)}
              </p>

              <div className="flex justify-between">
                <button
                  onClick={() => handleOpenDetails(order)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                >
                  Ver Detalles
                </button>
                {(userRole === "admin" || userRole === "encargado") && (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(order.id, "atendiendo")}
                      disabled={order.status === "atendiendo"}
                      className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                    >
                      Atender
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, "preparando")}
                      disabled={order.status === "preparando"}
                      className="bg-yellow-500 hover:bg-yellow-700 text-gray-800 font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                    >
                      Preparar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(order.id, "enviado")}
                      disabled={order.status === "enviado"}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                    >
                      Enviar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {openDetails && selectedPedidoDetails && (
        <div
          className="fixed z-50 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseDetails}
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              ​
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Detalle Completo de la Orden No.{" "}
                  {selectedPedidoDetails.orderId.substring(0, 8)}
                </h3>
                <div className="mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p>
                        <strong>Order ID:</strong> {selectedPedidoDetails.id}
                      </p>
                      <p>
                        <strong>Estado:</strong>{" "}
                        <span
                          className={`inline-block px-2 py-1 font-semibold text-sm rounded-full ${getStatusBadgeClass(
                            selectedPedidoDetails.status
                          )}`}
                        >
                          {selectedPedidoDetails.status}
                        </span>
                      </p>
                      <p>
                        <strong>Total:</strong>{" "}
                        {formatPriceCOP(selectedPedidoDetails.total)}
                      </p>
                      <p>
                        <strong>Costo de Envío:</strong>{" "}
                        {formatPriceCOP(selectedPedidoDetails.deliveryFee)}
                      </p>
                      <p>
                        <strong>Método de Pago:</strong>{" "}
                        {selectedPedidoDetails.paymentMethod}
                      </p>
                      <p>
                        <strong>Domicilio Incluido:</strong>{" "}
                        {selectedPedidoDetails.deliveryIncluded ? "Sí" : "No"}
                      </p>
                      <p>
                        <strong>Sede:</strong> {selectedPedidoDetails.sede}
                      </p>
                      <p>
                        <strong>Fecha del Pedido:</strong>{" "}
                        {selectedPedidoDetails.orderDate.toLocaleString()}
                      </p>
                      <p>
                        <strong>Personas:</strong>{" "}
                        {selectedPedidoDetails.people
                          .map((p) => p.name)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Pedidos por Persona:
                      </h4>
                      {selectedPedidoDetails.people.map((person) => (
                        <div
                          key={person.id}
                          className="mb-3 p-2 rounded border border-gray-200"
                        >
                          <h5 className="font-semibold">{person.name}</h5>
                          <ul className="list-disc pl-5">
                            {selectedPedidoDetails.items
                              .filter((item) => item.assignedTo === person.name)
                              .map((item, index) => {
                                const menuItem = menu.find(
                                  (menuItem) => menuItem.id === item.id
                                ); // Find menu item by id
                                return (
                                  <li key={index}>
                                    {menuItem
                                      ? menuItem.name
                                      : "Producto no encontrado"}{" "}
                                    (Cantidad: {item.quantity}){" "}
                                    {/* Display item name */}
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ))}
                      {selectedPedidoDetails.sharedItems &&
                        selectedPedidoDetails.sharedItems.length > 0 && (
                          <div className="mb-3 p-2 rounded border border-gray-200">
                            <h5 className="font-semibold">Pedido Compartido</h5>
                            <ul className="list-disc pl-5">
                              {selectedPedidoDetails.sharedItems.map(
                                (sharedItem, index) => {
                                  const menuItem = menu.find(
                                    (menuItem) =>
                                      menuItem.id === sharedItem.itemId
                                  ); // Find shared menu item by id
                                  return (
                                    <li key={index}>
                                      {menuItem
                                        ? menuItem.name
                                        : "Producto no encontrado"}{" "}
                                      (Cantidad Compartida:{" "}
                                      {sharedItem.quantity}){" "}
                                      {/* Display shared item name */}
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-100 text-base font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCloseDetails}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoList;
/* Fin src\components\pedidos\PedidoList.tsx */
