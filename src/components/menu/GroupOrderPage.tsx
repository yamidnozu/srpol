import React, { useEffect, useRef, useState } from "react";
import { MenuItem as MenuItemType } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { COLLECTIONS } from "../../utils/constants";
import { db } from "../../utils/firebase";
import NameModal from "./MenuModal"; // Renamed import to NameModal to avoid confusion
import OrderReview from "./partials/OrderReview";
import PeopleSelection from "./partials/PeopleSelection";
import PersonOrder from "./partials/PersonOrder";
import SharedOrder from "./partials/SharedOrder";

// Export the Person interface
export interface Person {
  personIndex: number;
  userId: string | null;
  name: string;
  items: { id: string; quantity: number }[];
  locked?: boolean;
  finished?: boolean;
}

// Export the SharedOrderItem interface
export interface SharedOrderItem {
  itemId: string;
  quantity: number;
  personIds: string[];
}

export interface GroupOrderPageProps {
  name: string;
}

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { menu } = useMenu();
  const { user } = useAuth();
  const [numPeople, setNumPeople] = useState<number>(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [showPeopleNames, setShowPeopleNames] = useState(false);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("shared");
  const [feedbackMessage] = useState<string>("");
  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null);
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false); // Estado para el modal de nombre
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number | null>(null); // Indice de la persona actual para el modal de nombre
  const navigate = useNavigate();

  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null);
  const personOrderSummaryRef = useRef<HTMLDivElement>(null);
  const [, setIsMobile] = useState(false);
  const [, setIsSummaryVisible] = useState(true);
  const { groupOrderId: routeGroupId } = useParams();
  const [searchParams] = useSearchParams();
  const codeFromURL = searchParams.get("code");
  const joiningWithCode = !!codeFromURL; // Determina si se está uniendo con código

  const filteredMenu = menu.filter(
    (item) => item.availabilityStatus !== "noDisponibleLargoPlazo"
  );

  const menuCategories = filteredMenu.reduce((categories, item) => {
    const category = item.recommendation || "General";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
    return categories;
  }, {} as { [category: string]: MenuItemType[] });

  useEffect(() => {
    if (routeGroupId) {
      setGroupOrderId(routeGroupId);
      setGroupOrderCode(codeFromURL);
      subscribeToGroupOrder(routeGroupId);
    } else {
      console.log(
        "GroupOrderPage - No routeGroupId, not subscribing to group order."
      );
    }
  }, [routeGroupId, codeFromURL]);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener("resize", handleResize);
    setIsSummaryVisible(!checkMobile());
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const subscribeToGroupOrder = (groupId: string) => {
    if (!groupId) return; // Avoid subscribing with empty groupId
    const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupId);
    console.log(
      "GroupOrderPage - Subscribing to group order with ID:",
      groupId
    );

    return onSnapshot(
      groupOrderDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const groupOrderData = docSnapshot.data();
          console.log("GroupOrderPage - Snapshot data:", groupOrderData);
          if (groupOrderData) {
            setGroupOrderCode(groupOrderData.code as string);
            setPeople(groupOrderData.participants as Person[]);
            setSharedOrderItems(
              groupOrderData.sharedItems as SharedOrderItem[]
            );
            setIsOwner(user?.uid === groupOrderData.ownerId);
            const finishedCheck = (
              groupOrderData.participants as Person[]
            )?.every((p) => p.finished);
            setAllFinished(finishedCheck);

            if (
              groupOrderData.participants &&
              groupOrderData.participants.length !== numPeople
            ) {
              setNumPeople(groupOrderData.participants.length);
            }
          }
        } else {
          console.log(
            "GroupOrderPage - No existe el documento del pedido grupal!"
          );
          // Si el documento no existe, podría ser un código inválido o pedido cancelado.
          // Redirigir al usuario a una página de error o a la página principal del menú.
          navigate("/menu"); // Redirige a la página del menú. Considera una página de error.
        }
      },
      (error) => {
        console.error(
          "GroupOrderPage - Error al suscribirse al pedido grupal:",
          error
        );
        // Similar al caso de documento no encontrado, redirigir en caso de error de suscripción.
        navigate("/menu"); // Redirige a la página del menú en caso de error.
      }
    );
  };

  const handleNumPeopleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const num = Number(event.target.value);
    setNumPeople(num);

    setPeople((prevPeople) => {
      const currentPeopleCount = prevPeople.length;
      if (num > currentPeopleCount) {
        const newPeople = Array.from(
          { length: num - currentPeopleCount },
          (_, index) => ({
            personIndex: currentPeopleCount + index,
            userId: null,
            name: `Persona ${currentPeopleCount + index + 1}`,
            items: [],
            locked: false,
            finished: false,
          })
        );
        return [...prevPeople, ...newPeople];
      } else if (num < currentPeopleCount) {
        return prevPeople.slice(0, num);
      } else {
        return prevPeople;
      }
    });
  };

  const handlePersonNameChange = (index: number, name: string) => {
    const updatedPeople = [...people];
    if (updatedPeople[index]) {
      updatedPeople[index].name = name;
      setPeople(updatedPeople);
    } else {
      console.error(`Index ${index} out of bounds for people array.`);
    }
  };

  const handleStartOrder = () => {
    if (people.every((person) => person.name.trim() !== "")) {
      setShowPeopleNames(true);
      setActiveTab("shared");
    } else {
      alert("Por favor, ingresa el nombre de cada persona.");
    }
  };

  const handleReviewOrder = () => {
    distributeSharedOrderItems();
    setShowPedidoForm(true);
  };

  const calculateSubtotal = (
    personItems: { id: string; quantity: number }[]
  ) => {
    let total = 0;
    personItems.forEach((item) => {
      const menuItem = menu.find((m) => m.id === item.id);
      if (menuItem) {
        total += menuItem.price * item.quantity;
      }
    });
    return total;
  };

  const calculateSharedSubtotal = () => {
    let total = 0;
    sharedOrderItems.forEach((sharedItem) => {
      const menuItem = menu.find((m) => m.id === sharedItem.itemId);
      if (menuItem) {
        total += menuItem.price * sharedItem.quantity;
      }
    });
    return total;
  };

  const handleAddToSharedOrder = async (item: MenuItemType) => {
    if (item.availabilityStatus !== "disponible") {
      return;
    }
    const existingItemIndex = sharedOrderItems.findIndex(
      (sharedItem) => sharedItem.itemId === item.id
    );
    let updatedSharedOrderItems;
    if (existingItemIndex > -1) {
      updatedSharedOrderItems = sharedOrderItems.map((si, index) =>
        index === existingItemIndex ? { ...si, quantity: si.quantity + 1 } : si
      );
    } else {
      updatedSharedOrderItems = [
        ...sharedOrderItems,
        { itemId: item.id, quantity: 1, personIds: [] },
      ];
    }
    setSharedOrderItems(updatedSharedOrderItems);
    if (groupOrderId) {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      });
    }
  };

  const handleSharedOrderItemQuantityChange = async (
    itemId: string,
    quantity: number
  ) => {
    if (quantity < 0) return;
    const updatedSharedOrderItems = sharedOrderItems.map((sharedItem) =>
      sharedItem.itemId === itemId ? { ...sharedItem, quantity } : sharedItem
    );
    setSharedOrderItems(updatedSharedOrderItems);
    if (groupOrderId) {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      });
    }
  };

  const handleRemoveSharedOrderItem = async (itemId: string) => {
    const updatedSharedOrderItems = sharedOrderItems.filter(
      (item) => item.itemId !== itemId
    );
    setSharedOrderItems(updatedSharedOrderItems);
    if (groupOrderId) {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      });
    }
  };

  const distributeSharedOrderItems = () => {
    const itemsToDistribute = [...sharedOrderItems];
    if (!people || people.length === 0) {
      console.error(
        "Error: People array is empty when distributing shared items."
      );
      return;
    }

    const updatedPeople = people.map((person) => ({
      ...person,
      items: [...person.items],
    }));

    itemsToDistribute.forEach((sharedItem) => {
      const menuItem = menu.find((m) => m.id === sharedItem.itemId);
      if (menuItem) {
        for (let i = 0; i < sharedItem.quantity; i++) {
          if (updatedPeople.length === 0) {
            console.error(
              "Error: updatedPeople array is empty during item distribution."
            );
            return;
          }
          const personToAssign = updatedPeople.reduce(
            (bestPerson, currentPerson) => {
              if (
                !bestPerson ||
                !bestPerson.items ||
                !currentPerson ||
                !currentPerson.items
              ) {
                console.error(
                  "Error: Undefined person object encountered in reduce function.",
                  { bestPerson, currentPerson }
                );
                return bestPerson;
              }

              const bestPersonItemsCount = bestPerson.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              const currentPersonItemsCount = currentPerson.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              return currentPersonItemsCount < bestPersonItemsCount
                ? currentPerson
                : bestPerson;
            },
            updatedPeople[0]
          );
          if (personToAssign && personToAssign.items) {
            personToAssign.items.push({ id: sharedItem.itemId, quantity: 1 });
          }
        }
      }
    });
    setPeople(updatedPeople);
    setSharedOrderItems([]);
  };

  const handleAddItemToPerson = async (
    personIndex: number,
    menuItemToAdd: MenuItemType // More descriptive parameter name
  ) => {
    console.log(
      "GroupOrderPage - handleAddItemToPerson CALLED",
      personIndex,
      menuItemToAdd
    ); // Log: function call
    console.log(
      "GroupOrderPage - handleAddItemToPerson - Item:",
      menuItemToAdd
    ); // Log: item details
    console.log(
      "GroupOrderPage - handleAddItemToPerson - Typeof menuItemToAdd:",
      typeof menuItemToAdd
    ); // Log: type of menuItemToAdd

    if (
      !menuItemToAdd ||
      typeof menuItemToAdd !== "object" ||
      !menuItemToAdd.id
    ) {
      console.error(
        "GroupOrderPage - handleAddItemToPerson - Invalid menuItemToAdd object received:",
        menuItemToAdd
      );
      return;
    }

    if (menuItemToAdd.availabilityStatus !== "disponible") {
      return;
    }

    const updatedParticipants = people.map((p, index) => {
      if (index === personIndex) {
        const itemExists = p.items.some(
          (orderItem) => orderItem.id === menuItemToAdd.id
        );
        if (itemExists) {
          console.log(
            "GroupOrderPage - handleAddItemToPerson - Item exists, updating quantity"
          ); // Log: item exists
          return {
            ...p,
            items: p.items.map((orderItem) =>
              orderItem.id === menuItemToAdd.id
                ? { ...orderItem, quantity: orderItem.quantity + 1 }
                : orderItem
            ),
          };
        } else {
          console.log(
            "GroupOrderPage - handleAddItemToPerson - Item does not exist, adding new item"
          ); // Log: new item
          return {
            ...p,
            items: [...p.items, { id: menuItemToAdd.id, quantity: 1 }],
          };
        }
      }
      return p;
    });
    setPeople(updatedParticipants);
    console.log(
      "GroupOrderPage - handleAddItemToPerson - Updated Participants:",
      updatedParticipants
    ); // Log: updated state

    if (groupOrderId) {
      console.log(
        "GroupOrderPage - handleAddItemToPerson - Updating Firestore..."
      ); // Log: Firestore update start
      try {
        const groupOrderDocRef = doc(
          db,
          COLLECTIONS.GROUP_ORDERS,
          groupOrderId
        );
        await updateDoc(groupOrderDocRef, {
          participants: updatedParticipants,
        });
        console.log(
          "GroupOrderPage - handleAddItemToPerson - Firestore update SUCCESS"
        ); // Log: Firestore update success
      } catch (error) {
        console.error(
          "GroupOrderPage - handleAddItemToPerson - Firestore update FAILED",
          error
        ); // Log: Firestore update fail
      }
    } else {
      console.log(
        "GroupOrderPage - handleAddItemToPerson - No groupOrderId, Firestore update skipped"
      ); // Log: Firestore skip
    }
  };

  const handlePersonOrderItemQuantityChange = async (
    personIndex: number,
    itemId: string,
    quantity: number
  ) => {
    if (quantity < 0) return;
    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return {
          ...person,
          items: person.items.map((it) =>
            it.id === itemId ? { ...it, quantity } : it
          ),
        };
      }
      return person;
    });
    setPeople(updatedParticipants);

    if (groupOrderId) {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants });
    }
  };

  const handleRemoveItemFromPerson = async (
    personIndex: number,
    itemId: string
  ) => {
    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return {
          ...person,
          items: person.items.filter((item) => item.id !== itemId),
        };
      }
      return person;
    });
    setPeople(updatedParticipants);

    if (groupOrderId) {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants });
    }
  };

  const handleClaimPersonTab = async (personIndex: number) => {
    if (!groupOrderId || !user) return;

    const currentPerson = people[personIndex];
    if (currentPerson && currentPerson.name.startsWith("Persona ")) {
      setCurrentPersonIndex(personIndex);
      setShowNameModal(true);
      return; // Show name modal and exit
    }

    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex && !person.locked) {
        return { ...person, userId: user.uid, locked: true };
      }
      return person;
    });
    setPeople(updatedParticipants);

    const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
    await updateDoc(groupOrderDocRef, { participants: updatedParticipants });
  };

  const handlePersonFinishedOrder = async (personIndex: number) => {
    if (!groupOrderId) return;

    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return { ...person, finished: true };
      }
      return person;
    });
    setPeople(updatedParticipants);
    const allAreFinished = updatedParticipants.every((p) => p.finished);
    setAllFinished(allAreFinished);

    const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
    await updateDoc(groupOrderDocRef, {
      participants: updatedParticipants,
      allFinished: allAreFinished,
    });
  };

  const handleNameModalClose = () => {
    setShowNameModal(false);
    setCurrentPersonIndex(null);
  };

  const handleNameSubmit = async (name: string) => {
    console.log("GroupOrderPage - handleNameSubmit - Name received:", name); // Debug log
    if (currentPersonIndex !== null && groupOrderId) {
      const updatedParticipants = people.map((person, index) =>
        index === currentPersonIndex
          ? { ...person, name, userId: user?.uid, locked: true }
          : person
      );
      setPeople(updatedParticipants);
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId);
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants });
      setShowNameModal(false);
      setCurrentPersonIndex(null);
    }
  };

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        ¡Pedido Grupal Fácil y Divertido! 🎉
      </h1>

      {groupOrderCode && (
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Código de Pedido Compartido:{" "}
            <span className="font-bold text-indigo-600">{groupOrderCode}</span>
          </h3>
          <p className="text-sm text-gray-500">
            Comparte este código con tus amigos para que se unan al pedido.
          </p>
        </div>
      )}

      {!showPeopleNames && !joiningWithCode ? (
        <PeopleSelection
          numPeople={numPeople}
          people={people}
          onNumPeopleChange={handleNumPeopleChange}
          onPersonNameChange={handlePersonNameChange}
          onStartOrder={handleStartOrder}
        />
      ) : !showPedidoForm ? (
        <>
          <div className="border-b border-gray-200 mb-4">
            <nav
              className="-mb-px flex space-x-8 overflow-x-auto md:overflow-x-hidden"
              aria-label="Tabs"
            >
              <button
                onClick={() => setActiveTab("shared")}
                className={`${
                  activeTab === "shared"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300`}
              >
                🍕 Para Compartir
              </button>
              {people.map((person, index) => (
                <div
                  key={person.personIndex}
                  className={`${
                    activeTab === `person-${index}`
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 cursor-pointer`}
                  onClick={() => setActiveTab(`person-${index}`)}
                >
                  {person.name}
                  {!person.locked && !person.finished && user?.uid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimPersonTab(index);
                      }}
                      className="ml-2 px-2 py-1 bg-indigo-200 text-indigo-700 rounded-full text-xs hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Soy yo
                    </button>
                  )}
                  {person.finished && (
                    <span className="ml-2 text-green-500">✅ Terminado</span>
                  )}
                  {person.locked && person.userId !== user?.uid && (
                    <span className="ml-2 text-red-500">🔒 Viendo</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {activeTab === "shared" && (
            <SharedOrder
              menuCategories={menuCategories}
              sharedOrderItems={sharedOrderItems}
              onAddToSharedOrder={handleAddToSharedOrder}
              onSharedOrderItemQuantityChange={
                handleSharedOrderItemQuantityChange
              }
              onRemoveSharedOrderItem={handleRemoveSharedOrderItem}
              calculateSharedSubtotal={calculateSharedSubtotal}
              sharedOrderSummaryRef={sharedOrderSummaryRef}
              activeTab={activeTab}
              menu={menu}
            />
          )}

          {people.map(
            (person, index) =>
              activeTab === `person-${index}` && (
                <PersonOrder
                  key={person.personIndex}
                  person={person}
                  index={index}
                  menuCategories={menuCategories}
                  menu={menu}
                  onAddItemToPerson={(index, menuItem) =>
                    handleAddItemToPerson(index, menuItem)
                  }
                  onPersonOrderItemQuantityChange={(index, itemId, quantity) =>
                    handlePersonOrderItemQuantityChange(index, itemId, quantity)
                  }
                  onRemoveItemFromPerson={(index, itemId) =>
                    handleRemoveItemFromPerson(index, itemId)
                  }
                  calculateSubtotal={calculateSubtotal}
                  personOrderSummaryRef={personOrderSummaryRef}
                  activeTab={activeTab}
                  onPersonFinishedOrder={handlePersonFinishedOrder}
                  isFinished={person.finished || false}
                  personLocked={person.locked || false} // Pass locked status
                  isCurrentUserTab={person.userId === user?.uid} // Check if is current user's tab
                  personIndex={index} // Pass personIndex as prop
                />
              )
          )}

          <div className="flex justify-center mt-8">
            {isOwner && allFinished ? (
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-300 animate-pulse hover:animate-none"
                onClick={handleReviewOrder}
              >
                ¡Revisar Pedido Grupal! ✅
              </button>
            ) : !isOwner ? (
              <p className="text-center text-gray-600">
                Espera a que el dueño del pedido revise y confirme.
              </p>
            ) : !allFinished ? (
              <p className="text-center text-gray-600">
                Aún faltan personas por confirmar su pedido.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <OrderReview
          people={people}
          sharedOrderItems={sharedOrderItems}
          menu={menu}
          onClosePedidoForm={() => setShowPedidoForm(false)}
          calculateSharedSubtotal={calculateSharedSubtotal}
          calculateSubtotal={calculateSubtotal}
          isOrderOwner={isOwner} // Pass isOwner prop here
        />
      )}

      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {feedbackMessage}
        </div>
      )}
      <NameModal // Use NameModal here, not MenuModal
        open={showNameModal}
        onClose={handleNameModalClose}
        onSubmit={handleNameSubmit}
        initialValues={{ name: "" }}
      />
    </div>
  );
};

export default GroupOrderPage;