import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PedidoForm from "../components/pedidos/PedidoForm";
import { MenuItem } from "../context/AppContext";
import { useMenu } from "../hooks/useMenu";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

interface Person {
  id: string;
  name: string;
  items: { id: string; quantity: number }[];
}

const MenuPage: React.FC = () => {
  const { menu } = useMenu();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [, setOpenPedidoModal] = useState(false);
  const [loadingAddSampleData, setLoadingAddSampleData] = useState(false); // Estado para el botón de carga de ejemplo
  const [message, setMessage] = useState<string | null>(null); // Estado para mensajes de feedback

  const handleNumPeopleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNumPeople(Number(event.target.value));
  };

  const handleNameChange = (index: number, value: string) => {
    const updatedPeople = [...people];
    updatedPeople[index].name = value;
    setPeople(updatedPeople);
  };

  const handleStartOrder = () => {
    const initialPeople = Array.from({ length: numPeople }, (_, index) => ({
      id: uuidv4(),
      name: `Persona ${index + 1}`,
      items: [],
    }));
    setPeople(initialPeople);
    setShowMenu(true);
  };

  const handleAddItemToPerson = (personId: string, item: MenuItem) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: [...person.items, { id: item.id, quantity: 1 }],
            }
          : person
      )
    );
  };

  const handleQuantityChange = (
    personId: string,
    itemId: string,
    quantity: number
  ) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: person.items.map((item) =>
                item.id === itemId ? { ...item, quantity: quantity } : item
              ),
            }
          : person
      )
    );
  };

  const handleRemoveItemFromPerson = (personId: string, itemId: string) => {
    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              items: person.items.filter((item) => item.id !== itemId),
            }
          : person
      )
    );
  };

  const handleOpenPedidoModal = () => {
    setOpenPedidoModal(true);
  };

  const handleClosePedidoModal = () => {
    setOpenPedidoModal(false);
  };

  const generateSampleMenuItems = () => {
    return [
      {
        name: "Hamburguesa Clásica",
        description: "Carne de res, queso cheddar, lechuga, tomate y cebolla.",
        price: 28000,
        imageUrl: "https://ejemplo.com/hamburguesa.jpg",
        available: true,
        recommendation: "Ideal con papas fritas.",
        observations: "Se puede pedir sin cebolla.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Pizza Margarita",
        description: "Salsa de tomate, mozzarella fresca y albahaca.",
        price: 35000,
        imageUrl: "https://ejemplo.com/pizza.jpg",
        available: true,
        recommendation: "Perfecta para compartir.",
        observations: "Opción vegana disponible con queso de almendras.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Ensalada César",
        description: "Lechuga romana, crutones, parmesano y aderezo César.",
        price: 22000,
        imageUrl: "https://ejemplo.com/ensalada.jpg",
        available: true,
        recommendation: "Ligera y refrescante.",
        observations: "Se puede añadir pollo a la parrilla.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Pasta Carbonara",
        description:
          "Spaghetti, huevo, panceta, queso pecorino romano y pimienta negra.",
        price: 32000,
        imageUrl: "https://ejemplo.com/pasta_carbonara.jpg",
        available: true,
        recommendation: "Un clásico italiano.",
        observations: "Sin gluten disponible con pasta de arroz.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Tacos al Pastor",
        description: "Carne de cerdo adobada, piña, cebolla y cilantro.",
        price: 30000,
        imageUrl: "https://ejemplo.com/tacos_pastor.jpg",
        available: true,
        recommendation: "Sabor auténtico mexicano.",
        observations: "Picante medio.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Sushi Variado (12 piezas)",
        description: "Selección de nigiris y makis variados.",
        price: 50000,
        imageUrl: "https://ejemplo.com/sushi.jpg",
        available: true,
        recommendation: "Para amantes del sushi.",
        observations: "Incluye salsa de soya, wasabi y jengibre.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Pollo Frito",
        description: "Crujientes piezas de pollo frito, receta secreta.",
        price: 15000,
        imageUrl: "https://ejemplo.com/pollo_frito.jpg",
        available: true,
        recommendation: "Ideal para niños y adultos.",
        observations: "Opción extra crujiente disponible.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Sopa de Tomate",
        description: "Sopa cremosa de tomate, hecha en casa.",
        price: 18000,
        imageUrl: "https://ejemplo.com/sopa_tomate.jpg",
        available: true,
        recommendation: "Caliente y reconfortante.",
        observations: "Servida con pan tostado.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Brownie con Helado",
        description: "Brownie de chocolate caliente con helado de vainilla.",
        price: 20000,
        imageUrl: "https://ejemplo.com/brownie_helado.jpg",
        available: true,
        recommendation: "Postre perfecto.",
        observations: "Se puede pedir sin nueces.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
      {
        name: "Jugo de Naranja Natural",
        description: "Jugo de naranja recién exprimido.",
        price: 8000,
        imageUrl: "https://ejemplo.com/jugo_naranja.jpg",
        available: true,
        recommendation: "Bebida refrescante.",
        observations: "Sin azúcar añadida.",
        availabilityStatus: "disponible", // Por defecto disponible
      },
    ];
  };

  const handleAddSampleData = async () => {
    setLoadingAddSampleData(true);
    setMessage("Agregando datos de ejemplo...");
    try {
      const sampleMenuItems = generateSampleMenuItems();
      const menuCollectionRef = collection(db, COLLECTIONS.MENU);
      for (const item of sampleMenuItems) {
        await addDoc(menuCollectionRef, item);
      }
      setMessage("Datos de ejemplo agregados exitosamente!");
    } catch (error) {
      console.error("Error al agregar datos de ejemplo:", error);
      setMessage("Error al agregar datos de ejemplo.");
    } finally {
      setLoadingAddSampleData(false);
      setTimeout(() => setMessage(null), 5000); // Limpiar mensaje después de 5 segundos
    }
  };

  // Function to format price to Colombian Pesos
  const formatPriceCOP = (price: number) => {
    return price.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0, // Remove cents if whole number
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="container mx-auto my-8 p-4 md:p-8">
      <button
        onClick={handleAddSampleData}
        disabled={loadingAddSampleData}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {loadingAddSampleData
          ? "Agregando..."
          : "Agregar Datos de Ejemplo al Menú"}
      </button>
      {/* Container principal con Tailwind */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Menú</h1>
      {/* Título principal */}
      {!showMenu ? (
        <div className="grid gap-4 mb-4 md:grid-cols-2">
          {/* Contenedor para selección de personas */}
          <div className="mb-4">
            <label
              htmlFor="numPeople"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Número de personas:
            </label>
            <input
              type="number"
              id="numPeople"
              value={numPeople}
              onChange={handleNumPeopleChange}
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {people.map((person, index) => (
            <div key={person.id} className="mb-4">
              <label
                htmlFor={`personName-${index}`}
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Nombre de la persona {index + 1} (Opcional):
              </label>
              <input
                type="text"
                id={`personName-${index}`}
                value={person.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          ))}
          <div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleStartOrder}
            >
              Empezar Pedido
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            {" "}
            {/* Contenedor para el botón "Agregar Datos de Ejemplo" */}
            <button
              onClick={handleAddSampleData}
              disabled={loadingAddSampleData}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loadingAddSampleData
                ? "Agregando..."
                : "Agregar Datos de Ejemplo al Menú"}
            </button>
            {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}{" "}
            {/* Mensaje de feedback */}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Grid para personas y menú */}
            {people.map((person) => (
              <div key={person.id} className="p-4 border rounded-lg shadow-md">
                {/* Card persona */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {person.name || "Persona sin nombre"}
                </h2>
                {/* Título persona */}
                <p className="text-gray-700 mb-2">Items:</p>
                {person.items.length > 0 ? (
                  <ul className="list-none pl-0 mb-4">
                    {/* Lista de items */}
                    {person.items.map((item) => {
                      const menuItem = menu.find(
                        (menuItem) => menuItem.id === item.id
                      );
                      return menuItem ? (
                        <li key={item.id} className="mb-2">
                          <div className="flex items-center justify-between">
                            <p className="text-gray-700">{menuItem.name} x </p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    person.id,
                                    item.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                min="1"
                                className="shadow appearance-none border rounded w-16 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center"
                              />
                              <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-sm"
                                onClick={() =>
                                  handleRemoveItemFromPerson(person.id, item.id)
                                }
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </li>
                      ) : null;
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500 mb-4">
                    Esta persona aún no tiene items.
                  </p>
                )}
                <p className="text-gray-700 font-semibold mb-2">Menú:</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {/* Grid menú por persona */}
                  {menu.map((item) => (
                    <button
                      key={item.id}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => handleAddItemToPerson(person.id, item)}
                    >
                      {item.name} - {formatPriceCOP(item.price)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleOpenPedidoModal}
            >
              Realizar Pedido
            </button>
          </div>
          <PedidoForm onClose={handleClosePedidoModal} people={people} />
        </>
      )}
    </div>
  );
};

export default MenuPage;
