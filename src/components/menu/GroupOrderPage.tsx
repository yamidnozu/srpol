/* Directorio: src\components\menu\GroupOrderPage.tsx */
/* Directorio: src\components\menu\GroupOrderPage.tsx */
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MenuItem } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";
import PedidoForm from "../forms/PedidoForm"; // Correct import path

interface Person {
    id: string;
    name: string;
    items: { id: string; quantity: number }[];
}

const GroupOrderPage: React.FC = () => {
    const { menu } = useMenu();
    const [numPeople, setNumPeople] = useState<number>(1);
    const [people, setPeople] = useState<Person[]>([]);
    const [showPeopleNames, setShowPeopleNames] = useState(false);
    const [showPedidoForm, setShowPedidoForm] = useState(false);
    const [sharedOrderItems, setSharedOrderItems] = useState<
        { itemId: string; quantity: number; personIds: string[] }[]
    >([]);
    const [activeTab, setActiveTab] = useState<string>("shared");

    const sharedOrderSummaryRef = useRef<HTMLDivElement>(null);
    const personOrderSummaryRef = useRef<HTMLDivElement>(null);
    const [, setIsMobile] = useState(false);
    const [, setIsSummaryVisible] = useState(true);

    // Nuevos estados añadidos
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
    const [feedbackMessage, setFeedbackMessage] = useState<string>("");

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
                const newPeople = Array.from({ length: num - currentPeopleCount }, (_, index) => ({
                    id: uuidv4(),
                    name: `Persona ${currentPeopleCount + index + 1}`,
                    items: [],
                }));
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
        updatedPeople[index].name = name;
        setPeople(updatedPeople);
    };


    const handleStartOrder = () => {
        if (people.every(person => person.name.trim() !== "")) {
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

    const handleAddToSharedOrder = (item: MenuItem) => {
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
        const updatedPeople = people.map((person) => ({
            ...person,
            items: [...person.items],
        }));

        itemsToDistribute.forEach((sharedItem) => {
            const menuItem = menu.find((m) => m.id === sharedItem.itemId);
            if (menuItem) {
                for (let i = 0; i < sharedItem.quantity; i++) {
                    const personToAssign = updatedPeople.reduce(
                        (bestPerson, currentPerson) => {
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

                    personToAssign.items.push({ id: sharedItem.itemId, quantity: 1 });
                }
            }
        });
        setPeople(updatedPeople);
        setSharedOrderItems([]);
    };

    const handleAddItemToPerson = (personId: string, item: MenuItem) => {
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

    const handlePersonOrderItemQuantityChange = (personId: string, itemId: string, quantity: number) => {
        if (quantity < 0) return;
        setPeople(prevPeople =>
            prevPeople.map(person => {
                if (person.id === personId) {
                    return {
                        ...person,
                        items: person.items.map(item =>
                            item.id === itemId ? { ...item, quantity } : item
                        )
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


    const handleToggleSelectPerson = (personId: string) => {
        setSelectedPeople((prev) =>
            prev.includes(personId)
                ? prev.filter((id) => id !== personId)
                : [...prev, personId]
        );
    };

    const handleAddToSelected = (item: MenuItem) => {
        const targetPeople = people.filter((person) =>
            selectedPeople.includes(person.id)
        );

        setPeople((prevPeople) =>
            prevPeople.map((person) => {
                if (selectedPeople.includes(person.id)) {
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
            })
        );

        setSharedOrderItems(prevSharedOrderItems =>
            prevSharedOrderItems.map(sharedItem => {
                if (sharedItem.itemId === item.id) {
                    return {
                        ...sharedItem,
                        personIds: [...sharedItem.personIds, ...selectedPeople]
                    };
                }
                return sharedItem;
            })
        );

        setSelectedPeople([]);
        setActiveItemId(null);

        const names = targetPeople.map((p) => p.name).join(", ");
        setFeedbackMessage(`Añadido a las órdenes de: ${names}`);

        setTimeout(() => {
            setFeedbackMessage("");
        }, 3000);
    };


    const menuCategories = menu.reduce((categories, item) => {
        const category = item.recommendation || "General";
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(item);
        return categories;
    }, {});

    return (
        <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md relative">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
                ¡Pedido Grupal Fácil y Divertido! 🎉
            </h1>

            {!showPeopleNames ? (
                <div className="mb-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        ¿Cuántos son hoy?
                    </h2>
                    <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center space-x-4">
                            <label
                                htmlFor="numPeople"
                                className="block text-gray-700 text-sm font-bold"
                            >
                                Somos:
                            </label>
                            <input
                                type="number"
                                id="numPeople"
                                value={numPeople}
                                onChange={handleNumPeopleChange}
                                min="1"
                                className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center"
                            />
                            <span className="text-gray-700 text-sm font-bold">
                                Personas
                            </span>
                        </div>
                        {Array.from({ length: numPeople }).map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                placeholder={`Nombre Persona ${index + 1}`}
                                className="shadow appearance-none border rounded w-full max-w-sm py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={people[index]?.name || ""}
                                onChange={(e) => handlePersonNameChange(index, e.target.value)}
                            />
                        ))}
                    </div>

                    <button
                        className="mt-6 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline transition-colors duration-300"
                        onClick={handleStartOrder}
                    >
                        ¡A Pedir! 🚀
                    </button>
                </div>
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
                                <button
                                    key={person.id}
                                    onClick={() => setActiveTab(person.id)}
                                    className={`${
                                        activeTab === person.id
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300`}
                                >
                                    {person.name || `Persona ${index + 1}`}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {activeTab === "shared" && (
                        <div className="mb-8">
                            <div className="sticky top-16 bg-white p-4 shadow-md z-20 rounded-md transition-transform duration-200 ease-out transform translate-y-0 hover:translate-y-[-2px] ring-2 ring-indigo-500 ring-opacity-50 hover:ring-opacity-100" ref={sharedOrderSummaryRef}>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                                    Pedido para Compartir 🤝
                                </h2>
                                <ul className="mb-4">
                                    {sharedOrderItems.map((sharedItem) => {
                                        const menuItem = menu.find(
                                            (m) => m.id === sharedItem.itemId
                                        );
                                        return menuItem ? (
                                            <li
                                                key={sharedItem.itemId}
                                                className="flex justify-between items-center py-2 border-b border-gray-200"
                                            >
                                                <span className="flex-1 min-w-0"> {/* Item name takes available space */}
                                                    {menuItem.name}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleSharedOrderItemQuantityChange(sharedItem.itemId, sharedItem.quantity - 1)}
                                                        className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-6 text-center">{sharedItem.quantity}</span>
                                                    <button
                                                        onClick={() => handleSharedOrderItemQuantityChange(sharedItem.itemId, sharedItem.quantity + 1)}
                                                        className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveSharedOrderItem(sharedItem.itemId)}
                                                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-.478 0l-.345-9m7.021-2.01C18.692 6.905 17.127 5.536 15.313 5.536H8.687C6.873 5.536 5.308 6.905 5.308 8.72v.81c0 1.18.914 2.12 2.094 2.201l1.652.072m7.324 0l1.652-.072a2.094 2.094 0 002.094-2.201v-.81c0-1.814-1.365-3.183-3.187-3.183zm-2.961 8.903L15.7 11.855m-2.606 5.15l-2.796-5.15m5.136 0l-2.794 5.15z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <span className="w-12 text-right"> {/* Price with fixed width and right alignment */}
                                                    ${(menuItem.price * sharedItem.quantity).toFixed(2)}
                                                </span>
                                            </li>
                                        ) : null;
                                    })}
                                    {sharedOrderItems.length > 0 && (
                                        <li className="font-semibold text-right mt-2">
                                            Subtotal: <span className="text-indigo-700">${calculateSharedSubtotal().toFixed(2)}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <p className="text-gray-600 mb-4 text-center mt-4">
                                ¿Algo más para compartir? ¡Elige del menú!
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {Object.entries(menuCategories).map(
                                    ([categoryName, items]) => (
                                        <div key={categoryName} className="transition-all duration-300 transform hover:scale-105"> {/* Card animation */}
                                            <h3 className="font-bold text-lg text-gray-900 mb-2 text-indigo-500">
                                                {categoryName}
                                            </h3>
                                            <div className="flex flex-col space-y-2">
                                                {(items as MenuItem[]).map(
                                                    (item) => (
                                                        <button
                                                            key={item.id}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-left transition-colors duration-300"
                                                            onClick={() =>
                                                                handleAddToSharedOrder(
                                                                    item
                                                                )
                                                            }
                                                        >
                                                            {item.name} - ${item.price}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {people.map(
                        (person, index) =>
                            activeTab === person.id && (
                                <div
                                    key={person.id}
                                    className="mb-8"
                                    ref={personOrderSummaryRef}
                                >
                                    <div className="sticky top-16 bg-white p-4 shadow-md z-20 rounded-md transition-transform duration-200 ease-out transform translate-y-0 hover:translate-y-[-2px] ring-2 ring-indigo-500 ring-opacity-50 hover:ring-opacity-100">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                                            Pedido de {person.name || `Persona ${index + 1}`} 😋
                                        </h2>
                                        <ul className="mb-4">
                                            {person.items.map((item) => {
                                                const menuItem = menu.find((m) => m.id === item.id);
                                                return menuItem ? (
                                                    <li
                                                        key={item.id}
                                                        className="flex justify-between items-center py-2 border-b border-gray-200"
                                                    >
                                                        <span className="flex-1 min-w-0">
                                                            {menuItem.name}
                                                        </span>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handlePersonOrderItemQuantityChange(person.id, item.id, item.quantity - 1)}
                                                                className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-6 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handlePersonOrderItemQuantityChange(person.id, item.id, item.quantity + 1)}
                                                                className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveItemFromPerson(person.id, item.id)}
                                                                className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-.478 0l-.345-9m7.021-2.01C18.692 6.905 17.127 5.536 15.313 5.536H8.687C6.873 5.536 5.308 6.905 5.308 8.72v.81c0 1.18.914 2.12 2.094 2.201l1.652.072m7.324 0l1.652-.072a2.094 2.094 0 002.094-2.201v-.81c0-1.814-1.365-3.183-3.187-3.183zm-2.961 8.903L15.7 11.855m-2.606 5.15l-2.796-5.15m5.136 0l-2.794 5.15z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <span className="w-12 text-right">
                                                            ${(menuItem.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </li>
                                                ) : null;
                                            })}
                                            {person.items.length > 0 && (
                                                <li className="font-semibold text-right mt-2">
                                                    Subtotal: <span className="text-indigo-700">${calculateSubtotal(person.items).toFixed(2)}</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(menuCategories).map(
                                            ([categoryName, items]) => (
                                                <div key={categoryName} className="transition-all duration-300 transform hover:scale-105"> {/* Card animation */}
                                                    <h3 className="font-bold text-lg text-gray-900 mb-2 text-indigo-500">
                                                        {categoryName}
                                                    </h3>
                                                    <div className="flex flex-col space-y-2">
                                                        {(items as MenuItem[]).map(
                                                            (item) => (
                                                                <button
                                                                    key={item.id}
                                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-left transition-colors duration-300"
                                                                    onClick={() =>
                                                                        handleAddItemToPerson(
                                                                            person.id,
                                                                            item
                                                                        )
                                                                    }
                                                                >
                                                                    {item.name} - ${item.price}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                    )}

                    <div className="flex justify-center mt-8">
                        <button
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-300 animate-pulse hover:animate-none"  // Button pulse animation
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
                <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md animate-fade-in"> {/* Fade in animation for review */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
                        ¡Revisa tu Pedido Grupal! 🧐
                    </h2>
                    {sharedOrderItems.length > 0 && (
                        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
                                Pedido Compartido 🤝
                            </h3>
                            <ul>
                                {sharedOrderItems.map((sharedItem) => {
                                    const menuItem = menu.find(
                                        (m) => m.id === sharedItem.itemId
                                    );
                                    return menuItem ? (
                                        <li key={sharedItem.itemId} className="py-1 flex justify-between"> {/* Flex for alignment */}
                                            <span className="flex-1">{menuItem.name} x {sharedItem.quantity}</span> {/* Item name takes space */}
                                            <span className="w-12 text-right">${(menuItem.price * sharedItem.quantity).toFixed(2)}</span> {/* Price right aligned */}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                            <div className="font-semibold text-right">
                                Subtotal: <span className="text-indigo-700">${calculateSharedSubtotal().toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    {people.map((person) => (
                        <div
                            key={person.id}
                            className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-indigo-600">
                                {person.name || "Persona"}
                            </h3>
                            <ul>
                                {person.items.map((item) => {
                                    const menuItem = menu.find(
                                        (m) => m.id === item.id
                                    );
                                    return menuItem ? (
                                        <li key={item.id} className="py-1 flex justify-between"> {/* Flex for alignment */}
                                            <span className="flex-1">{menuItem.name} x {item.quantity}</span> {/* Item name takes space */}
                                            <span className="w-12 text-right">${(menuItem.price * item.quantity).toFixed(2)}</span> {/* Price right aligned */}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                            <div className="font-semibold text-right">
                                Subtotal: <span className="text-indigo-700">${calculateSubtotal(person.items).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    <PedidoForm
                        onClose={() => setShowPedidoForm(false)}
                        people={people}
                        sharedOrderItems={sharedOrderItems}
                    />
                </div>
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