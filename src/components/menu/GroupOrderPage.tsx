/* src/pages/GroupOrderPage.tsx */
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MenuItem } from "../../context/AppContext";
import { useMenu } from "../../hooks/useMenu";
import PedidoForm from "./PersonMenuModal";

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
        { itemId: string; quantity: number }[]
    >([]);
    const [activeTab, setActiveTab] = useState<string>("shared");
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [showPersonSelector, setShowPersonSelector] = useState<string | null>(null);
    const [selectedPeopleForMultiAdd, setSelectedPeopleForMultiAdd] = useState<string[]>([]);
    const orderSummaryRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isSummaryVisible, setIsSummaryVisible] = useState(true);

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
        setNumPeople(Number(event.target.value));
    };

    const handleStartOrder = () => {
        setShowPeopleNames(true);
        const initialPeople = Array.from({ length: numPeople }, (_, index) => ({
            id: uuidv4(),
            name: `Persona ${index + 1}`,
            items: [],
        }));
        setPeople(initialPeople);
        setActiveTab("shared");
    };

    const handleNameChange = (index: number, value: string) => {
        const updatedPeople = [...people];
        updatedPeople[index].name = value;
        setPeople(updatedPeople);
    };

    const handleReviewOrder = () => {
        distributeSharedOrderItems();
        setShowPedidoForm(true);
    };

    const calculateSubtotal = (personItems: { id: string; quantity: number }[]) => {
        let total = 0;
        personItems.forEach((item) => {
            const menuItem = menu.find((m) => m.id === item.id);
            if (menuItem) {
                total += menuItem.price * item.quantity;
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
            setSharedOrderItems([...sharedOrderItems, { itemId: item.id, quantity: 1 }]);
        }
    };

    const handleSharedOrderItemQuantityChange = (itemId: string, quantity: number) => {
        if (quantity < 0) return;
        setSharedOrderItems(sharedOrderItems.map((sharedItem) =>
            sharedItem.itemId === itemId ? { ...sharedItem, quantity } : sharedItem
        ));
    };

    const handleRemoveSharedOrderItem = (itemId: string) => {
        setSharedOrderItems(sharedOrderItems.filter(
            (item) => item.itemId !== itemId
        ));
    };

    const distributeSharedOrderItems = () => {
        const itemsToDistribute = [...sharedOrderItems];
        const updatedPeople = people.map((person) => ({ ...person, items: [...person.items] }));

        itemsToDistribute.forEach((sharedItem) => {
            const menuItem = menu.find((m) => m.id === sharedItem.itemId);
            if (menuItem) {
                for (let i = 0; i < sharedItem.quantity; i++) {
                    const personToAssign = updatedPeople.reduce((bestPerson, currentPerson) => {
                        const bestPersonItemsCount = bestPerson.items.reduce((sum, item) => sum + item.quantity, 0);
                        const currentPersonItemsCount = currentPerson.items.reduce((sum, item) => sum + item.quantity, 0);
                        return currentPersonItemsCount < bestPersonItemsCount ? currentPerson : bestPerson;
                    }, updatedPeople[0]);

                    personToAssign.items.push({ id: sharedItem.itemId, quantity: 1 });
                }
            }
        });
        setPeople(updatedPeople);
        setSharedOrderItems([]);
    };

    const handleAddItemToPerson = (personId: string, item: MenuItem) => {
        setPeople(prevPeople => {
            return prevPeople.map(person => {
                if (person.id === personId) {
                    const itemExists = person.items.some(orderItem => orderItem.id === item.id);
                    if (itemExists) {
                        return {
                            ...person,
                            items: person.items.map(orderItem =>
                                orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
                            ),
                        };
                    } else {
                        return { ...person, items: [...person.items, { id: item.id, quantity: 1 }] };
                    }
                }
                return person;
            });
        });
    };

    const handleQuantityChange = (personId: string, itemId: string, quantity: number) => {
        if (quantity < 1) return;
        setPeople(prevPeople => {
            return prevPeople.map(person => {
                if (person.id === personId) {
                    return {
                        ...person,
                        items: person.items.map(orderItem =>
                            orderItem.id === itemId ? { ...orderItem, quantity: quantity } : orderItem
                        ),
                    };
                }
                return person;
            });
        });
    };

    const handleRemoveItemFromPerson = (personId: string, itemId: string) => {
        setPeople(prevPeople => {
            return prevPeople.map(person => {
                if (person.id === personId) {
                    return {
                        ...person,
                        items: person.items.filter(orderItem => orderItem.id !== itemId),
                    };
                }
                return person;
            });
        });
    };

    const handleMultiAddToPeople = (currentItem: { id: string; quantity: number }, fromPersonId: string) => {
        const currentMenuItem = menu.find(menuItem => menuItem.id === currentItem.id);
        if (!currentMenuItem) return;

        selectedPeopleForMultiAdd.forEach(toPersonId => {
            if (toPersonId !== fromPersonId) {
                handleAddItemToPerson(toPersonId, currentMenuItem);
            }
        });

        const addedToNames = selectedPeopleForMultiAdd
            .filter(personId => personId !== fromPersonId)
            .map(personId => people.find(p => p.id === personId)?.name || 'Persona')
            .join(', ');

        if (addedToNames) {
            setFeedbackMessage(`Añadido a las órdenes de: ${addedToNames}`);
            setTimeout(() => setFeedbackMessage(null), 3000);
        }
        setShowPersonSelector(null);
        setSelectedPeopleForMultiAdd([]);
    };

    const togglePersonSelection = (personId: string) => {
        setSelectedPeopleForMultiAdd(prevSelected => {
            return prevSelected.includes(personId) ? prevSelected.filter(id => id !== personId) : [...prevSelected, personId];
        });
    };

    const toggleSummaryVisibility = () => {
        setIsSummaryVisible(!isSummaryVisible);
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
        <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                Pedido Grupal
            </h1>

            {!showPeopleNames ? (
                <div className="mb-8 text-center">
                    <label
                        htmlFor="numPeople"
                        className="block text-gray-700 text-sm font-bold mb-2"
                    >
                        ¿Para cuántas personas es el pedido?
                    </label>
                    <input
                        type="number"
                        id="numPeople"
                        value={numPeople}
                        onChange={handleNumPeopleChange}
                        min="1"
                        className="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mx-auto block"
                    />
                    <button
                        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={handleStartOrder}
                    >
                        Empezar Pedido
                    </button>
                </div>
            ) : !showPedidoForm ? (
                <>
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto md:overflow-x-hidden" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('shared')}
                                className={`${activeTab === 'shared' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Pedido Compartido
                            </button>
                            {people.map((person, index) => (
                                <button
                                    key={person.id}
                                    onClick={() => setActiveTab(person.id)}
                                    className={`${activeTab === person.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    {person.name || `Persona ${index + 1}`}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {activeTab === 'shared' && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Pedido Compartido
                            </h2>
                            <p className="text-gray-600 mb-4">
                                ¿Hay items que todos o varios van a querer? Agrégalos aquí para distribuirlos fácilmente después.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {sharedOrderItems.map((sharedItem) => {
                                    const menuItem = menu.find((m) => m.id === sharedItem.itemId);
                                    return menuItem ? (
                                        <div
                                            key={sharedItem.itemId}
                                            className="flex items-center justify-between p-4 border rounded-lg shadow-sm"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    {menuItem.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    Precio: ${menuItem.price}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={sharedItem.quantity}
                                                    onChange={(e) =>
                                                        handleSharedOrderItemQuantityChange(
                                                            sharedItem.itemId,
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    min="0"
                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                />
                                                <button
                                                    onClick={() => handleRemoveSharedOrderItem(sharedItem.itemId)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(menuCategories).map(([categoryName, items]) => (
                                    <div key={categoryName}>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                                            {categoryName}
                                        </h3>
                                        <div className="flex flex-col space-y-2">
                                            {(items as MenuItem[]).map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-left"
                                                    onClick={() => handleAddToSharedOrder(item)}
                                                >
                                                    {item.name} - ${item.price}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {people.map((person, index) => (
                        activeTab === person.id && (
                            <div key={person.id} className="mb-8">
                                <div className="mb-6 sticky top-0 bg-white  z-20">
                                    <div className="mb-6 p-4 shadow-md rounded-lg">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                            Pedido para {person.name || `Persona ${index + 1}`}
                                        </h2>
                                        <ul className="mb-4">
                                            {person.items.map((item) => {
                                                const menuItem = menu.find((m) => m.id === item.id);
                                                return menuItem ? (
                                                    <li
                                                        key={item.id}
                                                        className="flex justify-between items-center py-2 border-b border-gray-200"
                                                    >
                                                        <span>
                                                            {menuItem.name} x {item.quantity}
                                                        </span>
                                                        <span>
                                                            $
                                                            {calculateSubtotal(person.items).toFixed(2)}
                                                        </span>
                                                        <div className="relative">
                                                            <button
                                                                className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
                                                                onClick={() => setShowPersonSelector(showPersonSelector === item.id ? null : item.id)}
                                                            >
                                                                Añadir a Varios...
                                                            </button>

                                                            {showPersonSelector === item.id && (
                                                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 p-2">
                                                                    <h4 className="block w-full text-left px-2 py-1 text-sm font-semibold text-gray-700">
                                                                        Seleccionar Personas:
                                                                    </h4>
                                                                    <div className="max-h-48 overflow-y-auto">
                                                                        {people.map(p => (
                                                                            p.id !== person.id && (
                                                                                <label key={p.id} className="block px-4 py-2 text-sm hover:bg-gray-100">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="mr-2"
                                                                                        value={p.id}
                                                                                        onChange={() => togglePersonSelection(p.id)}
                                                                                    />
                                                                                    {p.name || 'Persona'}
                                                                                </label>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        className="block w-full text-center px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-700 mt-2"
                                                                        onClick={() => handleMultiAddToPeople(item, person.id)}
                                                                    >
                                                                        Añadir a Seleccionados
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                ) : null;
                                            })}
                                            {person.items.length > 0 && (
                                                <li className="font-semibold text-right">
                                                    Subtotal: ${calculateSubtotal(person.items).toFixed(2)}
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(menuCategories).map(([categoryName, items]) => (
                                            <div key={categoryName}>
                                                <h3 className="font-bold text-lg text-gray-900 mb-2">
                                                    {categoryName}
                                                </h3>
                                                <div className="flex flex-col space-y-2">
                                                    {(items as MenuItem[]).map((item) => (
                                                        <button
                                                            key={item.id}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-left"
                                                            onClick={() => handleAddItemToPerson(person.id, item)}
                                                        >
                                                            {item.name} - ${item.price}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        ) 
                    ))}   
                    <div className="flex justify-center mt-8">
                        <button
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline disabled:opacity-50"
                            onClick={handleReviewOrder}
                            disabled={people.some((person) => person.items.length === 0) && sharedOrderItems.length === 0}
                        >
                            Revisar y Realizar Pedido
                        </button>
                    </div>
                </>
            ) : (
                <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Resumen del Pedido Grupal
                    </h2>
                    {sharedOrderItems.length > 0 && (
                        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Pedido Compartido
                            </h3>
                            <ul>
                                {sharedOrderItems.map((sharedItem) => {
                                    const menuItem = menu.find((m) => m.id === sharedItem.itemId);
                                    return menuItem ? (
                                        <li key={sharedItem.itemId} className="py-1">
                                            {menuItem.name} x {sharedItem.quantity}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        </div>
                    )}
                    {people.map((person) => (
                        <div
                            key={person.id}
                            className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                {person.name || "Persona"}
                            </h3>
                            <ul>
                                {person.items.map((item) => {
                                    const menuItem = menu.find((m) => m.id === item.id);
                                    return menuItem ? (
                                        <li key={item.id} className="py-1">
                                            {menuItem.name} x {item.quantity}
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                            <div className="font-semibold text-right">
                                Subtotal: ${calculateSubtotal(person.items).toFixed(2)}
                            </div>
                        </div>
                    ))}         
                    <PedidoForm
                        onClose={() => setShowPedidoForm(false)}
                        people={people}
                    />
                </div>
            )}
        </div>
    );
};

export default GroupOrderPage;