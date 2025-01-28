/* src\pages\MenuPage.tsx */
/* src\pages\MenuPage.tsx */
import { Typography } from "@mui/material";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { GroupOrder, Person } from "../components/menu/GroupOrderPage"; // Importa interfaces
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
  const [people, setPeople] = useState<Person[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [, setOpenPedidoModal] = useState(false);
  const [loadingAddSampleData, setLoadingAddSampleData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isCreatingSharedOrder, setIsCreatingSharedOrder] = useState(false);
  const [isJoiningOrder, setIsJoiningOrder] = useState(false);
  const [, setJoinCode] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleStartOrder = async () => {
    setIsCreatingSharedOrder(true);
    const initialPeople = Array.from({ length: numPeople }, (_, index) => ({
      personIndex: index, // Añade personIndex aquí
      userId: null,
      name: `Persona ${index + 1}`,
      items: [],
      locked: false,
      finished: false,
    }));
    setPeople(initialPeople);
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
          participants: initialPeople,
          sharedItems: [],
        } as GroupOrder // Asegura el tipado aquí
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
    setPeople((prevPeople) =>
      prevPeople.map((person, index) =>
        index === personIndex
          ? {
              ...person,
              items: [...person.items, { itemId: item.id, quantity: 1 }], // Usa itemId en lugar de id
            }
          : person
      )
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
                item.itemId === itemId // Usa itemId para comparar
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
              items: person.items.filter((item) => item.itemId !== itemId), // Usa itemId para filtrar
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
        availabilityStatus: "disponible",
        id: "sample_item_1", // Añade IDs únicos
      },
      {
        name: "Pizza Margarita",
        description: "Salsa de tomate, mozzarella fresca y albahaca.",
        price: 35000,
        imageUrl: "https://ejemplo.com/pizza.jpg",
        available: true,
        recommendation: "Perfecta para compartir.",
        observations: "Opción vegana disponible con queso de almendras.",
        availabilityStatus: "disponible",
        id: "sample_item_2",
      },
      {
        name: "Ensalada César",
        description: "Lechuga romana, crutones, parmesano y aderezo César.",
        price: 22000,
        imageUrl: "https://ejemplo.com/ensalada.jpg",
        available: true,
        recommendation: "Ligera y refrescante.",
        observations: "Se puede añadir pollo a la parrilla.",
        availabilityStatus: "disponible",
        id: "sample_item_3",
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
        availabilityStatus: "disponible",
        id: "sample_item_4",
      },
      {
        name: "Tacos al Pastor",
        description: "Carne de cerdo adobada, piña, cebolla y cilantro.",
        price: 30000,
        imageUrl: "https://ejemplo.com/tacos_pastor.jpg",
        available: true,
        recommendation: "Sabor auténtico mexicano.",
        observations: "Picante medio.",
        availabilityStatus: "disponible",
        id: "sample_item_5",
      },
      {
        name: "Sushi Variado (12 piezas)",
        description: "Selección de nigiris y makis variados.",
        price: 50000,
        imageUrl: "https://ejemplo.com/sushi.jpg",
        available: true,
        recommendation: "Para amantes del sushi.",
        observations: "Incluye salsa de soya, wasabi y jengibre.",
        availabilityStatus: "disponible",
        id: "sample_item_6",
      },
      {
        name: "Pollo Frito",
        description: "Crujientes piezas de pollo frito, receta secreta.",
        price: 15000,
        imageUrl: "https://ejemplo.com/pollo_frito.jpg",
        available: true,
        recommendation: "Ideal para niños y adultos.",
        observations: "Opción extra crujiente disponible.",
        availabilityStatus: "disponible",
        id: "sample_item_7",
      },
      {
        name: "Sopa de Tomate",
        description: "Sopa cremosa de tomate, hecha en casa.",
        price: 18000,
        imageUrl: "https://ejemplo.com/sopa_tomate.jpg",
        available: true,
        recommendation: "Caliente y reconfortante.",
        observations: "Servida con pan tostado.",
        availabilityStatus: "disponible",
        id: "sample_item_8",
      },
      {
        name: "Brownie con Helado",
        description: "Brownie de chocolate caliente con helado de vainilla.",
        price: 20000,
        imageUrl: "https://ejemplo.com/brownie_helado.jpg",
        available: true,
        recommendation: "Postre perfecto.",
        observations: "Se puede pedir sin nueces.",
        availabilityStatus: "disponible",
        id: "sample_item_9",
      },
      {
        name: "Jugo de Naranja Natural",
        description: "Jugo de naranja recién exprimido.",
        price: 8000,
        imageUrl: "https://ejemplo.com/jugo_naranja.jpg",
        available: true,
        recommendation: "Bebida refrescante.",
        observations: "Sin azúcar añadida.",
        availabilityStatus: "disponible",
        id: "sample_item_10",
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
      setTimeout(() => setMessage(null), 5000);
    }
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
      <div className="mb-4 flex justify-between items-center">
        <Typography
          variant="h4"
          component="h1"
          className="text-3xl font-bold text-gray-900"
        >
          Menú
        </Typography>
        <Button
          onClick={handleAddSampleData}
          disabled={loadingAddSampleData}
          variant="contained"
          color="success"
        >
          {loadingAddSampleData ? "Cargando..." : "Cargar Menú Ejemplo"}
        </Button>
      </div>

      <div className="mb-6 flex space-x-4">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreatingSharedOrder(true)}
        >
          Crear Pedido Compartido
        </Button>
        <Button variant="outlined" color="primary" onClick={handleJoinOrder}>
          Unirme a Pedido Existente
        </Button>
      </div>

      {message && <div className="mb-4 text-red-500">{message}</div>}

      {isCreatingSharedOrder && !showMenu && (
        <div className="grid gap-4 mb-4 md:grid-cols-2">
          <div className="mb-4">
            <label
              htmlFor="numPeople"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Número de personas:
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
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartOrder}
            >
              Empezar Pedido Compartido
            </Button>
          </div>
        </div>
      )}

      {showMenu && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {people.map((person, personIndex) => (
              <div
                key={person.personIndex} // Usa personIndex como key
                className="p-4 border rounded-lg shadow-md"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {person.name || `Persona ${personIndex + 1}`}
                </h2>
                <p className="text-gray-700 mb-2">Items:</p>
                {person.items.length > 0 ? (
                  <ul className="list-none pl-0 mb-4">
                    {person.items.map((item) => {
                      const menuItem = menu.find(
                        (menuItem) => menuItem.id === item.itemId // Usa itemId para buscar
                      );
                      return menuItem ? (
                        <li key={item.itemId} className="mb-2">
                          <div className="flex items-center justify-between">
                            <p className="text-gray-700">{menuItem.name} x </p>
                            <div className="flex items-center space-x-2">
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handlePersonOrderItemQuantityChange(
                                    personIndex,
                                    item.itemId,
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
                                  handleRemoveItemFromPerson(
                                    personIndex,
                                    item.itemId
                                  )
                                }
                                sx={{ py: 1, px: 2, fontSize: "0.8rem" }}
                              >
                                Eliminar
                              </Button>
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
                  {menu.map((item) => (
                    <Button
                      key={item.id}
                      variant="contained"
                      color="primary"
                      onClick={() => handleAddItemToPerson(personIndex, item)}
                    >
                      {item.name} - {formatPriceCOP(item.price)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button
              variant="contained"
              color="success"
              onClick={handleOpenPedidoModal}
            >
              Realizar Pedido
            </Button>
          </div>
          <PedidoForm onClose={handleClosePedidoModal} people={people} />
        </>
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
