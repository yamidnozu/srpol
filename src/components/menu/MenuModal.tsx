// src/components/menu/MenuModal.tsx
import React, { useState } from 'react'
import { MenuItem } from '../../context/AppContext'

interface MenuModalProps {
  open: boolean
  onClose: () => void
  initialValues?: Partial<MenuItem>
  onSubmit: (values: Partial<MenuItem>) => void | Promise<void>
}

const MenuModal: React.FC<MenuModalProps> = ({ open, onClose, initialValues, onSubmit }) => {
  const [localValues, setLocalValues] = useState<Partial<MenuItem>>(initialValues ?? {})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLocalValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(localValues)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          maxWidth: 500,
          margin: '50px auto',
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Editar / Agregar ítem al Menú</h3>
        <form onSubmit={void handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Nombre:</label>
            <input name="name" type="text" value={localValues.name ?? ''} onChange={handleChange} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Descripción:</label>
            <textarea
              name="description"
              value={localValues.description ?? ''}
              onChange={handleChange}
            />
          </div>
          {/* ... otros campos price, imageUrl, etc. */}

          <div style={{ marginTop: '1rem' }}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" style={{ marginLeft: 8 }}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MenuModal
