/* src\components\menu\partials\PeopleSelection.tsx */
import React from 'react';

interface PeopleSelectionProps {
  numPeople: number;
  people: { id: string; name: string }[];
  onNumPeopleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPersonNameChange: (index: number, name: string) => void;
  onStartOrder: () => void;
}

const PeopleSelection: React.FC<PeopleSelectionProps> = ({
  numPeople,
  people,
  onNumPeopleChange,
  onPersonNameChange,
  onStartOrder,
}) => {
  return (
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
            onChange={onNumPeopleChange}
            min="1"
            className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center"
          />
          <span className="text-gray-700 text-sm font-bold">Personas</span>
        </div>
        {Array.from({ length: numPeople }).map((_, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Nombre Persona ${index + 1}`}
            className="shadow appearance-none border rounded w-full max-w-sm py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={people[index]?.name || ""}
            onChange={(e) => onPersonNameChange(index, e.target.value)}
          />
        ))}
      </div>

      <button
        className="mt-6 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline transition-colors duration-300"
        onClick={onStartOrder}
      >
        ¡A Pedir! 🚀
      </button>
    </div>
  );
};

export default PeopleSelection;