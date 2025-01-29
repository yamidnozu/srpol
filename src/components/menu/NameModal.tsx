/** src/components/menu/NameModal.tsx **/
import React, { FormEvent, useState } from 'react'

interface NameModalProps {
  open: boolean
  onClose: () => void
  currentName?: string
  onSubmit: (name: string) => void
}

const NameModal: React.FC<NameModalProps> = ({ open, onClose, currentName = '', onSubmit }) => {
  const [tempName, setTempName] = useState<string>(currentName)

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Llamamos al onSubmit con el contenido (si está vacío, que sea el currentName anterior)
    onSubmit(tempName.trim() || currentName)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-center">¿Cuál es tu nombre?</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Déjalo vacío si prefieres 'Persona X'"
            className="border border-gray-300 rounded w-full p-2"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Aceptar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NameModal
