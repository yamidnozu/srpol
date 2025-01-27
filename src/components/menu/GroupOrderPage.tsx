/* Inicio src\components\menu\GroupOrderPage.tsx */
/* src\components\menu\GroupOrderPage.tsx */
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MenuItem as MenuItemType } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";

import OrderReview from "./partials/OrderReview";
import PeopleSelection from "./partials/PeopleSelection";
import PersonOrder from "./partials/PersonOrder";
import SharedOrder from "./partials/SharedOrder";

interface Person {
  id: string;
  name: string;
  items: { id: string; quantity: number }[];
}

interface SharedOrderItem {
  itemId: string;
  quantity: number;
  personIds: string[];
}

export interface GroupOrderPageProps {
  name: string;
}

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { menu } = useMenu();
  const [numPeople, setNumPeople] = useState<number>(1);
  // Initialize people with one person by default to avoid undefined issues
  const [people, setPeople] = useState<Person[]>([
    { id: uuidv4(), name: `Persona 1`, items: [] },
  ]);
  const [showPeopleNames, setShowPeopleNames] = useState(false);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("shared");
  const [feedbackMessage] = useState<string>("");

  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null);
  const personOrderSummaryRef = useRef<HTMLDivElement>(null);
  const [, setIsMobile] = useState(false);
  const [, setIsSummaryVisible] = useState(true);

  // Filtra el menú para mostrar solo disponibles y no disponibles en el momento (excluye "Ya no disponible")
  const filteredMenu = menu.filter(
    (item) => item.availabilityStatus !== "noDisponibleLargoPlazo"
  );

  // Agrupa el menú filtrado por categoría (usando recommendation como categoría)
  const menuCategories = filteredMenu.reduce((categories, item) => {
    const category = item.recommendation || "General";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
    return categories;
  }, {} as { [category: string]: MenuItemType[] });

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener("resize", handleResize);
    setIsSummaryVisible(!checkMobile());
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            id: uuidv4(),
            name: `Persona ${currentPeopleCount + index + 1}`,
            items: [],
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
    // Create a copy of the people array to avoid direct state mutation
    const updatedPeople = [...people];
    // Ensure the index is valid before trying to access and modify
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

  const handleAddToSharedOrder = (item: MenuItemType) => {
    if (item.availabilityStatus !== "disponible") {
      return;
    }
    const existingItemIndex = sharedOrderItems.findIndex(
      (sharedItem) => sharedItem.itemId === item.id
    );
    if (existingItemIndex > -1) {
      const updatedSharedOrderItems = [...sharedOrderItems];
      updatedSharedOrderItems[existingItemIndex].quantity += 1;
      setSharedOrderItems(updatedSharedOrderItems);
    } else {
      setSharedOrderItems([
        ...sharedOrderItems,
        { itemId: item.id, quantity: 1, personIds: [] },
      ]);
    }
  };

  const handleSharedOrderItemQuantityChange = (
    itemId: string,
    quantity: number
  ) => {
    if (quantity < 0) return;
    const updatedSharedOrderItems = sharedOrderItems.map((sharedItem) =>
      sharedItem.itemId === itemId ? { ...sharedItem, quantity } : sharedItem
    );
    setSharedOrderItems(updatedSharedOrderItems);
  };

  const handleRemoveSharedOrderItem = (itemId: string) => {
    const updatedSharedOrderItems = sharedOrderItems.filter(
      (item) => item.itemId !== itemId
    );
    setSharedOrderItems(updatedSharedOrderItems);
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

  const handleAddItemToPerson = (personId: string, item: MenuItemType) => {
    if (item.availabilityStatus !== "disponible") {
      return;
    }
    setPeople((prevPeople) => {
      return prevPeople.map((person) => {
        if (person.id === personId) {
          const itemExists = person.items.some(
            (orderItem) => orderItem.id === item.id
          );
          if (itemExists) {
            return {
              ...person,
              items: person.items.map((orderItem) =>
                orderItem.id === item.id
                  ? { ...orderItem, quantity: orderItem.quantity + 1 }
                  : orderItem
              ),
            };
          } else {
            return {
              ...person,
              items: [...person.items, { id: item.id, quantity: 1 }],
            };
          }
        }
        return person;
      });
    });
  };

  const handlePersonOrderItemQuantityChange = (
    personId: string,
    itemId: string,
    quantity: number
  ) => {
    if (quantity < 0) return;
    setPeople((prevPeople) =>
      prevPeople.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            items: person.items.map((it) =>
              it.id === itemId ? { ...it, quantity } : it
            ),
          };
        }
        return person;
      })
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

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        ¡Pedido Grupal Fácil y Divertido! 🎉
      </h1>

      {!showPeopleNames ? (
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
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => setActiveTab(person.id)}
                  className={`${
                    activeTab === person.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300`}
                >
                  {person.name}
                </button>
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
              activeTab === person.id && (
                <PersonOrder
                  key={person.id}
                  person={person}
                  index={index}
                  menuCategories={menuCategories}
                  menu={menu}
                  onAddItemToPerson={handleAddItemToPerson}
                  onPersonOrderItemQuantityChange={
                    handlePersonOrderItemQuantityChange
                  }
                  onRemoveItemFromPerson={handleRemoveItemFromPerson}
                  calculateSubtotal={calculateSubtotal}
                  personOrderSummaryRef={personOrderSummaryRef}
                  activeTab={activeTab}
                />
              )
          )}

          <div className="flex justify-center mt-8">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-300 animate-pulse hover:animate-none"
              onClick={handleReviewOrder}
              disabled={
                people.some((person) => person.items.length === 0) &&
                sharedOrderItems.length === 0
              }
            >
              ¡Revisar Pedido Grupal! ✅
            </button>
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
        />
      )}

      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default GroupOrderPage;

/* Fin src\components\menu\GroupOrderPage.tsx */
