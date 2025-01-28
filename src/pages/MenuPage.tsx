/* Inicio src\pages\MenuPage.tsx */
/* src\pages\MenuPage.tsx */
/* src\pages\MenuPage.tsx */
import { Typography } from "@mui/material";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Person } from "../components/menu/GroupOrderPage"; // Importa interfaces
import JoinOrderModal from "../components/menu/JoinOrderModal";
import PedidoForm from "../components/pedidos/PedidoForm";
import Button from "../components/ui/Button";
import Container from "../components/ui/Container";
import TextField from "../components/ui/TextField";
import { MenuItemType } from "../context/AppContext"; // Importa MenuItemType
import { useAuth } from "../hooks/useAuth";
import { useMenu } from "../hooks/useMenu";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

const MenuPage: React.FC = () => {
  const { menu } = useMenu();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [people, setPeople] = useState<Person[]>(() => {
    // Initialize people here
    return Array.from({ length: 1 }, (_, index) => ({
      personIndex: index,
      userId: null,
      name: `Persona ${index + 1}`, // Default name for initial render
      items: [],
      locked: false,
      finished: false,
    }));
  });
  const [showMenu, setShowMenu] = useState(false);
  const [, setOpenPedidoModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isCreatingSharedOrder, setIsCreatingSharedOrder] = useState(false);
  const [isJoiningOrder, setIsJoiningOrder] = useState(false);
  const [, setJoinCode] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNumPeopleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const num = Number(event.target.value);
    setNumPeople(num);

    // Initialize people array here based on numPeople
    const initialPeople = Array.from({ length: num }, (_, index) => ({
      personIndex: index,
      userId: null,
      name: `Persona ${index + 1}`, // Default name
      items: [],
      locked: false,
      finished: false,
    }));
    setPeople(initialPeople);
  };

  const handleNameChange = (index: number, value: string) => {
    const updatedPeople = [...people];
    if (updatedPeople[index]) {
      // Check if updatedPeople[index] is defined
      updatedPeople[index].name = value;
      setPeople(updatedPeople);
    }
  };

  const handleStartOrder = async () => {
    setIsCreatingSharedOrder(true);
    setShowMenu(true);

    const code = generateCode();
    try {
      if (!user) {
        setMessage("Debes iniciar sesión para crear un pedido compartido.");
        setTimeout(() => setMessage(null), 5000);
        setIsCreatingSharedOrder(false);
        return;
      }
      const groupOrderRef = await addDoc(
        collection(db, COLLECTIONS.GROUP_ORDERS),
        {
          code: code,
          ownerId: user.uid,
          status: "open",
          maxPeople: numPeople,
          createdAt: new Date(),
          participants: people, // Use the 'people' state which is now initialized
          sharedItems: [],
        }
      );
      navigate(`/menu/${groupOrderRef.id}?code=${code}`);
    } catch (error) {
      console.error("Error al crear pedido compartido en Firestore:", error);
      setMessage("Error al crear el pedido compartido.");
      setTimeout(() => setMessage(null), 5000);
      setIsCreatingSharedOrder(false);
    }
  };

  const handleAddItemToPerson = (personIndex: number, item: MenuItemType) => {
    setPeople(
      (prevPeople) =>
        prevPeople.map((person, index) =>
          index === personIndex
            ? {
                ...person,
                items: [...person.items, { itemId: item.id, quantity: 1 }], // Usa itemId en lugar de id
              }
            : person
        ) as Person[]
    );
  };

  const handlePersonOrderItemQuantityChange = (
    personIndex: number,
    itemId: string,
    quantity: string
  ) => {
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber < 0) {
      return;
    }

    setPeople((prevPeople) =>
      prevPeople.map((person, index) =>
        index === personIndex
          ? {
              ...person,
              items: person.items.map((item) =>
                item.id === itemId // Usa itemId para comparar
                  ? { ...item, quantity: quantityNumber }
                  : item
              ),
            }
          : person
      )
    );
  };

  const handleRemoveItemFromPerson = (personIndex: number, itemId: string) => {
    setPeople((prevPeople) =>
      prevPeople.map((person, index) =>
        index === personIndex
          ? {
              ...person,
              items: person.items.filter((item) => item.id !== itemId), // Usa itemId para filtrar
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

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleJoinOrder = () => {
    setIsJoiningOrder(true);
  };

  const processJoinOrder = async (code: string) => {
    setIsJoiningOrder(false);
    setJoinCode(code);
    const q = query(
      collection(db, COLLECTIONS.GROUP_ORDERS),
      where("code", "==", code),
      where("status", "==", "open")
    );
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const groupOrderDoc = querySnapshot.docs[0];
        navigate(`/menu/${groupOrderDoc.id}?code=${code}`);
      } else {
        setMessage(
          "No hay pedido activo con este código o el código es incorrecto."
        );
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error al buscar pedido compartido:", error);
      setMessage("Error al unirse al pedido compartido.");
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const formatPriceCOP = (price: number) => {
    return price.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <Container className="my-8">
      <div className="text-center mb-8">
        <Typography
          variant="h4"
          component="h1"
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          ¡Descubre nuestro Menú y Pide Fácil!
        </Typography>
        <Typography className="text-gray-600">
          Crea un pedido compartido con amigos o únete a uno existente.
        </Typography>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreatingSharedOrder(true)}
          className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          🎉 Crear Pedido Compartido
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleJoinOrder}
          className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          🤝 Unirme a Pedido Existente
        </Button>
      </div>

      {message && (
        <div className="mb-4 text-center text-red-500">{message}</div>
      )}

      {isCreatingSharedOrder && !showMenu && (
        <div className="max-w-md mx-auto p-6 rounded-xl shadow-lg bg-white animate-slide-down overflow-hidden">
          <Typography variant="h6" className="text-gray-800 mb-4 text-center">
            Configura tu Pedido Compartido
          </Typography>
          <div className="mb-4">
            <label
              htmlFor="numPeople"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ¿Cuántas personas?
            </label>
            <TextField
              type="number"
              id="numPeople"
              value={numPeople}
              onChange={handleNumPeopleChange}
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {Array.from({ length: numPeople }).map((_, index) => (
            <div key={index} className="mb-4">
              <label
                htmlFor={`personName-${index}`}
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Nombre de la persona {index + 1} (Opcional):
              </label>
              <TextField
                type="text"
                id={`personName-${index}`}
                value={people[index]?.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          ))}
          <div className="mt-6 text-center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartOrder}
              className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              Comenzar a Pedir
            </Button>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="mt-10">
          <Typography
            variant="h5"
            className="font-bold text-gray-900 mb-6 text-center"
          >
            Nuestro Menú para Hoy
          </Typography>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {people.map((person, personIndex) => (
              <div
                key={person.personIndex} // Usa personIndex como key
                className="p-6 border rounded-xl shadow-md bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {person.name || `Persona ${personIndex + 1}`}
                </h2>
                <p className="text-gray-700 mb-3">
                  Selecciona tus items del menú:
                </p>
                <ul className="mb-4 space-y-3">
                  {person.items.length > 0 ? (
                    person.items.map((item) => {
                      const menuItem = menu.find(
                        (menuItem) => menuItem.id === item.id // Usa itemId para buscar
                      );
                      return menuItem ? (
                        <li
                          key={item.id}
                          className="py-2 px-4 rounded-md bg-gray-100 flex items-center justify-between"
                        >
                          <Typography className="text-gray-800">
                            {menuItem.name} x {item.quantity}
                          </Typography>
                          <div className="flex items-center space-x-2">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handlePersonOrderItemQuantityChange(
                                  personIndex,
                                  item.id,
                                  e.target.value
                                )
                              }
                              min="1"
                              className="shadow appearance-none border rounded w-16 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center"
                            />
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() =>
                                handleRemoveItemFromPerson(personIndex, item.id)
                              }
                              className="py-1 px-3 text-sm rounded-md"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </li>
                      ) : null;
                    })
                  ) : (
                    <Typography className="text-gray-500">
                      Aún no has seleccionado items.
                    </Typography>
                  )}
                </ul>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {menu.map((item) => (
                    <Button
                      key={item.id}
                      variant="outlined"
                      color="primary"
                      onClick={() => handleAddItemToPerson(personIndex, item)}
                      className="py-2 px-4 rounded-md transition-colors duration-300 border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      {item.name} - {formatPriceCOP(item.price)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="contained"
              color="success"
              onClick={handleOpenPedidoModal}
              className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 text-xl"
            >
              ¡Realizar Pedido Grupal!
            </Button>
          </div>
          <PedidoForm onClose={handleClosePedidoModal} people={people} />
        </div>
      )}

      <JoinOrderModal
        open={isJoiningOrder}
        onClose={() => setIsJoiningOrder(false)}
        onJoinOrder={processJoinOrder}
      />
    </Container>
  );
};

export default MenuPage;
/* Fin src\pages\MenuPage.tsx */
