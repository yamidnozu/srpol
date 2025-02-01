/* Inicio src\pages\GestionMenu.tsx */
// src/pages/GestionMenu.tsx
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { COLLECTIONS } from '../utils/constants'
import { db } from '../utils/firebase'

import { createDefaultMenuItemsAndCombos, deleteAllMenuItems } from '../utils/menu-scripts' // Importa las funciones

/* =====================================================
   INTERFACES Y TIPOS
===================================================== */

// Para costos adicionales (aplica a ítems y combos)
export interface AdditionalCost {
  description: string
  amount: number
}

// Interfaz de producto (MenuItemType)
export interface MenuItemType {
  id?: string
  name: string
  description: string
  price: number // Precio de venta
  cost: number // Costo interno
  points: number // Puntos asignados
  imageUrls: string[]
  available: boolean
  recommendation: string
  observations: string
  availabilityStatus: 'disponible' | 'noDisponibleMomento' | 'noDisponibleLargoPlazo'
  // Para combos:
  isCombo?: boolean
  components?: string[] // IDs de productos individuales seleccionados
  minimumPrice?: number // Precio mínimo (suma de los costos base y adicionales)
  comboSellingPrice?: number // Precio de venta configurado para el combo
  comboPoints?: number // Puntos asignados para el combo
  // Costos adicionales (opcional)
  additionalCosts?: AdditionalCost[]
}

// Valores iniciales para el formulario
const initialFormValues: Partial<MenuItemType> = {
  name: '',
  description: '',
  price: 0,
  cost: 0,
  points: 0,
  imageUrls: [],
  available: true,
  recommendation: '',
  observations: '',
  availabilityStatus: 'disponible',
  isCombo: false,
  components: [],
  minimumPrice: 0,
  comboSellingPrice: 0,
  comboPoints: 0,
  additionalCosts: [],
}

/* =====================================================
   COMPONENTES AUXILIARES
===================================================== */

// Componente para agregar y eliminar imágenes individualmente
const ImageInputList: React.FC<{
  images: string[]
  onChange: (imgs: string[]) => void
}> = ({ images, onChange }) => {
  const [newUrl, setNewUrl] = useState<string>('')

  const addImage = () => {
    if (newUrl.trim() !== '') {
      onChange([...images, newUrl.trim()])
      setNewUrl('')
    }
  }

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
      <div className="space-y-2">
        {images.map((url, index) => (
          <div key={index} className="flex items-center border rounded p-1 bg-gray-50">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 p-1 bg-transparent focus:outline-none text-sm"
            />
            <button type="button" onClick={() => removeImage(index)} className="text-red-500 px-2">
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Nueva URL de imagen"
          className="flex-1 p-1 border rounded focus:outline-none text-sm"
        />
        <button
          type="button"
          onClick={addImage}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}

// Componente para gestionar costos adicionales
const AdditionalCostsInput: React.FC<{
  costs: AdditionalCost[]
  onChange: (costs: AdditionalCost[]) => void
}> = ({ costs, onChange }) => {
  const [desc, setDesc] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)

  const addCost = () => {
    if (desc.trim() !== '' && amount > 0) {
      onChange([...costs, { description: desc.trim(), amount }])
      setDesc('')
      setAmount(0)
    }
  }

  const removeCost = (index: number) => {
    const updated = costs.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Costos adicionales</label>
      {costs.length > 0 && (
        <ul className="space-y-1">
          {costs.map((cost, index) => (
            <li
              key={index}
              className="flex items-center justify-between border p-1 rounded bg-gray-50 text-sm"
            >
              <span>
                {cost.description}:{' '}
                {cost.amount.toLocaleString('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                })}
              </span>
              <button type="button" onClick={() => removeCost(index)} className="text-red-500 px-2">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descripción"
          className="p-1 border rounded focus:outline-none text-sm"
        />
        <input
          type="number"
          min="0"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Monto"
          className="p-1 border rounded focus:outline-none text-sm"
        />
      </div>
      <button
        type="button"
        onClick={addCost}
        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
      >
        Agregar costo
      </button>
    </div>
  )
}

// Componente Carousel sencillo para mostrar imágenes con animación
const Carousel: React.FC<{ images: string[] }> = ({ images }) => {
  const imgs = images || []
  const [current, setCurrent] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (imgs.length === 0) return
    const next = () => {
      setCurrent((prev) => (prev + 1) % imgs.length)
    }
    timeoutRef.current = setInterval(next, 3000)
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current)
    }
  }, [imgs])

  if (imgs.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Sin imagen</span>
      </div>
    )
  }
  return (
    <div className="relative">
      <img
        src={imgs[current]}
        alt="Producto"
        className="w-full h-48 object-cover transition-all duration-500"
      />
    </div>
  )
}

/* =====================================================
   COMPONENTE PRINCIPAL: GestionMenu
===================================================== */
const GestionMenu: React.FC = () => {
  // Estados principales
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [formValues, setFormValues] = useState<Partial<MenuItemType>>(initialFormValues)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  // Validaciones reactivas por campo
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  // Modo: 'item' o 'combo'
  const [mode, setMode] = useState<'item' | 'combo'>('item')
  // Para combos: flujo en 2 pasos
  const [comboStep, setComboStep] = useState<number>(1)

  /* --- CARGA DE DATOS --- */
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.MENU))
        const items: MenuItemType[] = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as MenuItemType[]
        setMenuItems(items)
      } catch (error) {
        console.error('Error al cargar el menú:', error)
        setAlert({ type: 'error', message: 'Error al cargar el menú' })
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])
  const handleBulkDeleteMenu = async () => {
    const success = await deleteAllMenuItems()
    if (success) {
      // Recargar menú si la eliminación fue exitosa
      fetchMenu()
    }
  }

  const handleBulkCreateDefaultMenu = async () => {
    const success = await createDefaultMenuItemsAndCombos()
    if (success) {
      // Recargar menú si la creación fue exitosa
      fetchMenu()
    }
  }
  /* --- VALIDACIONES REACTIVAS --- */
  useEffect(() => {
    const errors: { [key: string]: string } = {}
    // Validaciones generales
    if (!formValues.name || formValues.name.trim() === '') {
      errors.name = 'El nombre es obligatorio'
    }
    if (formValues.price !== undefined && formValues.price < 0) {
      errors.price = 'El precio no puede ser negativo'
    }
    if (formValues.cost !== undefined && formValues.cost < 0) {
      errors.cost = 'El costo no puede ser negativo'
    }
    if (formValues.points !== undefined && formValues.points < 0) {
      errors.points = 'Los puntos no pueden ser negativos'
    }
    // Validaciones para combos
    if (mode === 'combo') {
      if (!formValues.components || formValues.components.length === 0) {
        errors.components = 'Debes seleccionar al menos un producto para el combo' // Mensaje más descriptivo
      }
      const baseCost = computeBaseCost()
      if ((Number(formValues.comboSellingPrice) || 0) < baseCost) {
        errors.comboSellingPrice =
          'El precio de venta del combo no puede ser menor que la suma de los costos base' // Mensaje más claro
      }
      const compPoints = computeComponentsPoints()
      if ((Number(formValues.comboPoints) || 0) < compPoints) {
        errors.comboPoints =
          'Los puntos del combo no pueden ser menores que la suma de los puntos de los productos' // Mensaje más claro
      }
      if (formValues.comboSellingPrice !== undefined && formValues.comboSellingPrice < 0) {
        // Validación precio combo negativo
        errors.comboSellingPrice = 'El precio de venta del combo no puede ser negativo'
      }
      if (formValues.comboPoints !== undefined && formValues.comboPoints < 0) {
        // Validación puntos combo negativos
        errors.comboPoints = 'Los puntos del combo no pueden ser negativos'
      }
    }
    setFormErrors(errors)
  }, [formValues, mode])

  /* --- MANEJO DEL FORMULARIO --- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]:
        name === 'price' ||
        name === 'cost' ||
        name === 'points' ||
        name === 'minimumPrice' ||
        name === 'comboSellingPrice' ||
        name === 'comboPoints'
          ? Number(value) || 0
          : value,
    }))
  }

  // Cambio entre modos (producto o combo)
  const handleModeChange = (newMode: 'item' | 'combo') => {
    setMode(newMode)
    if (newMode === 'combo') {
      setComboStep(1)
    }
    setFormValues((prev) => ({
      ...prev,
      isCombo: newMode === 'combo',
      components: newMode === 'item' ? [] : prev.components,
      minimumPrice: newMode === 'item' ? 0 : prev.minimumPrice,
      comboSellingPrice: newMode === 'item' ? 0 : prev.comboSellingPrice,
      comboPoints: newMode === 'item' ? 0 : prev.comboPoints,
      additionalCosts: [],
    }))
  }

  // Selección de productos para el combo (solo productos individuales)
  const handleComponentToggle = (componentId: string) => {
    const current = formValues.components || []
    if (current.includes(componentId)) {
      setFormValues((prev) => ({
        ...prev,
        components: current.filter((id) => id !== componentId),
      }))
    } else {
      setFormValues((prev) => ({
        ...prev,
        components: [...current, componentId],
      }))
    }
  }

  // Funciones para calcular totales a partir de los productos seleccionados
  const computeBaseCost = () => {
    if (!formValues.components || menuItems.length === 0) return 0
    const compCost = menuItems
      .filter((item) => !item.isCombo && formValues.components.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    const additional = formValues.additionalCosts
      ? formValues.additionalCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
      : 0
    return compCost + additional
  }

  const computeSuggestedSellingPrice = () => {
    if (!formValues.components || menuItems.length === 0) return 0
    const sumPrice = menuItems
      .filter((item) => !item.isCombo && formValues.components.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    const additional = formValues.additionalCosts
      ? formValues.additionalCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
      : 0
    return sumPrice + additional
  }

  const computeComponentsPoints = () => {
    if (!formValues.components || menuItems.length === 0) return 0
    return menuItems
      .filter((item) => !item.isCombo && formValues.components.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.points) || 0), 0)
  }

  // Nueva función para calcular puntos sugeridos del combo (similar a computeSuggestedSellingPrice pero con puntos)
  const computeSuggestedPoints = () => {
    if (!formValues.components || menuItems.length === 0) return 0
    return menuItems
      .filter((item) => !item.isCombo && formValues.components.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.points) || 0), 0)
  }

  /* --- APERTURA Y EDICIÓN DEL MODAL --- */
  const openAddModal = (newMode: 'item' | 'combo') => {
    handleModeChange(newMode)
    setFormValues({ ...initialFormValues, isCombo: newMode === 'combo' })
    setEditingItem(null)
    setModalOpen(true)
  }

  const openEditModal = (item: MenuItemType) => {
    setEditingItem(item)
    setMode(item.isCombo ? 'combo' : 'item')
    // Para combo editado, ir directamente a la vista final (paso 2)
    if (item.isCombo) {
      setComboStep(2)
    }
    setFormValues(item)
    setModalOpen(true)
  }

  /* --- OPERACIONES CON FIRESTORE --- */
  const handleDelete = async (item: MenuItemType) => {
    if (window.confirm(`¿Eliminar el item "${item.name}"?`)) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.MENU, item.id))
        setMenuItems((prev) => prev.filter((i) => i.id !== item.id))
        setAlert({ type: 'success', message: 'Item eliminado correctamente' })
      } catch (error) {
        console.error(error)
        setAlert({ type: 'error', message: 'Error al eliminar el item' })
      }
    }
  }

  const handleSave = async () => {
    if (Object.keys(formErrors).length > 0) {
      setAlert({
        type: 'error',
        message: 'Corrige los errores antes de guardar',
      })
      return
    }
    if (!formValues.name || formValues.name.trim() === '') {
      setAlert({ type: 'error', message: 'El nombre es obligatorio' })
      return
    }
    try {
      if (editingItem) {
        await updateDoc(doc(db, COLLECTIONS.MENU, editingItem.id), formValues)
        setMenuItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ? ({ ...i, ...formValues } as MenuItemType) : i,
          ),
        )
        setAlert({ type: 'success', message: 'Item actualizado correctamente' })
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.MENU), formValues)
        setMenuItems((prev) => [...prev, { id: docRef.id, ...formValues } as MenuItemType])
        setAlert({ type: 'success', message: 'Item agregado correctamente' })
      }
      setModalOpen(false)
    } catch (error: any) {
      console.error(error)
      setAlert({ type: 'error', message: error.message || 'Error al guardar el item' })
    }
  }

  const handleMarkUnavailable = async (
    item: MenuItemType,
    type: 'noDisponibleMomento' | 'noDisponibleLargoPlazo',
  ) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.MENU, item.id), {
        availabilityStatus: type,
        available: false,
      })
      setMenuItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? ({ ...i, availabilityStatus: type, available: false } as MenuItemType)
            : i,
        ),
      )
      setAlert({
        type: 'success',
        message:
          type === 'noDisponibleMomento'
            ? 'Item marcado como no disponible ahora'
            : 'Item marcado como no disponible a largo plazo',
      })
    } catch (error: any) {
      console.error(error)
      setAlert({
        type: 'error',
        message: error.message || 'Error al actualizar la disponibilidad',
      })
    }
  }

  const closeAlert = () => setAlert(null)

  // Helper para formatear precios
  const formatPrice = (value: number | undefined) => {
    const num = Number(value)
    if (isNaN(num)) return 'N/A'
    return num.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    })
  }

  /* =====================================================
     RENDERIZADO PRINCIPAL
  ====================================================== */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Menú</h1>
      </header>

      {alert && (
        <div
          className={`mb-4 p-3 rounded flex justify-between items-center ${
            alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={closeAlert} className="font-bold text-xl">
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-2">
        <div className="flex space-x-2">
          <button
            onClick={() => openAddModal('item')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex-1"
          >
            Nuevo Producto
          </button>
          <button
            onClick={() => openAddModal('combo')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded flex-1"
          >
            Nuevo Combo
          </button>
        </div>
        {/* Aquí se agregan los nuevos botones */}
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={handleBulkDeleteMenu}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex-1"
          >
            Eliminar Todo el Menú
          </button>
          <button
            onClick={handleBulkCreateDefaultMenu}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex-1"
          >
            Crear Menú por Defecto
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Cargando menú...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <Carousel images={item.imageUrls ?? []} />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {item.availabilityStatus === 'disponible'
                    ? 'Disponible'
                    : item.availabilityStatus === 'noDisponibleMomento'
                      ? 'No Disponible Ahora'
                      : 'No Disponible a Largo Plazo'}
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                <div className="mt-2">
                  <span className="font-medium text-gray-700">Precio:</span>{' '}
                  <span className="text-gray-900">{formatPrice(item.price)}</span>
                </div>
                <div className="mt-1">
                  <span className="font-medium text-gray-700">Costo:</span>{' '}
                  <span className="text-gray-900">{formatPrice(item.cost)}</span>
                </div>
                <div className="mt-1">
                  <span className="font-medium text-gray-700">Puntos:</span>{' '}
                  <span className="text-gray-900">{item.points}</span>
                </div>
                {item.isCombo && (
                  <div className="mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-sm font-medium text-gray-800 mb-1">Combo</p>
                    <p className="text-xs text-gray-600">
                      Componentes:{' '}
                      {item.components &&
                        item.components
                          .map((compId) => {
                            const comp = menuItems.find((m) => m.id === compId)
                            return comp ? comp.name : ''
                          })
                          .join(', ')}
                    </p>
                    <p className="text-xs text-gray-600">
                      Base:{' '}
                      <span className="bg-red-100 px-1 rounded">{formatPrice(item.cost)}</span> |
                      Mínimo:{' '}
                      <span className="bg-red-100 px-1 rounded">
                        {formatPrice(item.minimumPrice || 0)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Venta: {formatPrice(item.comboSellingPrice || item.price)} | Puntos:{' '}
                      {item.comboPoints || item.points}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap justify-between mt-4 gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm flex-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm flex-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap justify-between mt-2 gap-2">
                  <button
                    onClick={() => handleMarkUnavailable(item, 'noDisponibleMomento')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs flex-1"
                  >
                    No Disponible Ahora
                  </button>
                  <button
                    onClick={() => handleMarkUnavailable(item, 'noDisponibleLargoPlazo')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs flex-1"
                  >
                    No Disponible Largo Plazo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Agregar/Editar Producto o Combo */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 my-4 mx-2 overflow-y-auto max-h-[90vh] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Editar Item' : 'Agregar Item'}
              </h2>
              {/* Botones para seleccionar modo */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleModeChange('item')}
                  className={`py-1 px-3 rounded ${
                    mode === 'item' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Producto
                </button>
                <button
                  onClick={() => handleModeChange('combo')}
                  className={`py-1 px-3 rounded ${
                    mode === 'combo' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Combo
                </button>
              </div>
            </div>

            {Object.keys(formErrors).length > 0 && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                Corrige los errores en el formulario.
              </div>
            )}

            {mode === 'combo' ? (
              <>
                {comboStep === 1 ? (
                  // Paso 1: Selección de productos e imágenes
                  <div className="space-y-4">
                    <p className="text-lg font-semibold text-gray-700">
                      Paso 1: Selecciona los productos para el combo
                    </p>
                    {formErrors.components && (
                      <p className="text-red-500 text-xs">{formErrors.components}</p>
                    )}
                    <div className="max-h-60 overflow-y-auto border rounded p-2">
                      {menuItems
                        .filter((item) => !item.isCombo)
                        .map((item) => (
                          <label key={item.id} className="flex items-center space-x-2 mb-1">
                            <input
                              type="checkbox"
                              checked={formValues.components?.includes(item.id) || false}
                              onChange={() => handleComponentToggle(item.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {item.name} ({formatPrice(item.cost)})
                            </span>
                          </label>
                        ))}
                    </div>
                    {/* Resumen de productos seleccionados */}
                    {formValues.components && formValues.components.length > 0 && (
                      <div className="mt-4 p-2 border rounded bg-white shadow">
                        <p className="font-semibold text-gray-700 mb-1">Productos Seleccionados:</p>
                        <ul className="divide-y divide-gray-200 text-sm">
                          {formValues.components.map((compId) => {
                            const product = menuItems.find((m) => m.id === compId)
                            if (!product) return null
                            return (
                              <li key={compId} className="flex justify-between py-1">
                                <span>{product.name}</span>
                                <span>{formatPrice(product.cost)}</span>
                              </li>
                            )
                          })}
                        </ul>
                        <div className="mt-2 text-right font-bold text-red-600">
                          Total Base: {formatPrice(computeBaseCost())}
                        </div>
                      </div>
                    )}
                    {/* Agregar imágenes para el combo */}
                    <ImageInputList
                      images={formValues.imageUrls || []}
                      onChange={(imgs) => setFormValues((prev) => ({ ...prev, imageUrls: imgs }))}
                    />
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                        type="button"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (!formValues.components || formValues.components.length === 0) {
                            setAlert({
                              type: 'error',
                              message: 'Debes seleccionar al menos un producto.',
                            })
                          } else {
                            // Pre-cargar sugerencias: precio de venta sugerido y puntos sugeridos
                            setFormValues((prev) => ({
                              ...prev,
                              comboSellingPrice: computeSuggestedSellingPrice(),
                              comboPoints: computeSuggestedPoints(), // Usar la función correcta aquí
                            }))
                            setComboStep(2)
                            setAlert(null)
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        type="button"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  // Paso 2: Ingresar información básica, costos adicionales y preview
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        value={formValues.name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border rounded focus:outline-none"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción</label>
                      <textarea
                        name="description"
                        value={formValues.description || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border rounded focus:outline-none"
                      ></textarea>
                    </div>
                    <AdditionalCostsInput
                      costs={formValues.additionalCosts || []}
                      onChange={(costs) =>
                        setFormValues((prev) => ({ ...prev, additionalCosts: costs }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Precio de Venta del Combo
                        </label>
                        <input
                          type="number"
                          name="comboSellingPrice"
                          min="0"
                          value={formValues.comboSellingPrice || 0}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border rounded focus:outline-none"
                        />
                        {formErrors.comboSellingPrice && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors.comboSellingPrice}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Puntos del Combo
                        </label>
                        <input
                          type="number"
                          name="comboPoints"
                          min="0"
                          value={formValues.comboPoints || 0}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border rounded focus:outline-none"
                        />
                        {formErrors.comboPoints && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.comboPoints}</p>
                        )}
                      </div>
                    </div>
                    {/* Preview del combo */}
                    <div className="p-4 border rounded bg-gray-50 shadow">
                      <p className="font-semibold text-gray-700 mb-1">Preview del Combo</p>
                      <p className="text-sm text-gray-600">
                        <strong>Nombre:</strong> {formValues.name || '(Sin nombre)'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Descripción:</strong>{' '}
                        {formValues.description || '(Sin descripción)'}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Productos Seleccionados:
                        </p>
                        <ul className="divide-y divide-gray-200 text-sm">
                          {formValues.components?.map((compId) => {
                            const product = menuItems.find((m) => m.id === compId)
                            if (!product) return null
                            return (
                              <li key={compId} className="flex justify-between py-1">
                                <span>{product.name}</span>
                                <span>{formatPrice(product.cost)}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Costos adicionales:</strong>{' '}
                          {formValues.additionalCosts && formValues.additionalCosts.length > 0
                            ? formValues.additionalCosts
                                .map(
                                  (c) =>
                                    `${c.description}: ${c.amount.toLocaleString('es-CO', {
                                      style: 'currency',
                                      currency: 'COP',
                                      minimumFractionDigits: 0,
                                    })}`,
                                )
                                .join(' | ')
                            : 'Ninguno'}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-red-600 font-bold">
                          Costo Base Sugerido: {formatPrice(computeBaseCost())}
                        </p>
                        <p className="text-sm text-green-600 font-bold">
                          Precio de Venta Sugerido: {formatPrice(computeSuggestedSellingPrice())}
                        </p>
                        <p className="text-sm text-indigo-600 font-bold">
                          Puntos Sugeridos: {computeSuggestedPoints()}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6 space-x-4">
                      <button
                        onClick={() => setComboStep(1)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                        type="button"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={Object.keys(formErrors).length > 0}
                        className={`${
                          Object.keys(formErrors).length > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white font-bold py-2 px-4 rounded`}
                        type="button"
                      >
                        Guardar Combo
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Modo Producto: formulario único
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formValues.name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border rounded focus:outline-none"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    name="description"
                    value={formValues.description || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border rounded focus:outline-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Precio de Venta
                    </label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      value={formValues.price || 0}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2 border rounded focus:outline-none"
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo</label>
                    <input
                      type="number"
                      name="cost"
                      min="0"
                      value={formValues.cost || 0}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2 border rounded focus:outline-none"
                    />
                    {formErrors.cost && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.cost}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Puntos</label>
                  <input
                    type="number"
                    name="points"
                    min="0"
                    value={formValues.points || 0}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border rounded focus:outline-none"
                  />
                  {formErrors.points && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.points}</p>
                  )}
                </div>
                <div className="mt-2">
                  <ImageInputList
                    images={formValues.imageUrls || []}
                    onChange={(imgs) => setFormValues((prev) => ({ ...prev, imageUrls: imgs }))}
                  />
                </div>
                <div className="mt-4">
                  <AdditionalCostsInput
                    costs={formValues.additionalCosts || []}
                    onChange={(costs) =>
                      setFormValues((prev) => ({ ...prev, additionalCosts: costs }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recomendación</label>
                    <input
                      type="text"
                      name="recommendation"
                      value={formValues.recommendation || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2 border rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <input
                      type="text"
                      name="observations"
                      value={formValues.observations || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2 border rounded focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">Disponibilidad</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          availabilityStatus: 'disponible',
                          available: true,
                        }))
                      }
                      className={`flex-1 py-2 rounded ${
                        formValues.availabilityStatus === 'disponible'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Disponible
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          availabilityStatus: 'noDisponibleMomento',
                          available: false,
                        }))
                      }
                      className={`flex-1 py-2 rounded ${
                        formValues.availabilityStatus === 'noDisponibleMomento'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      No Disponible Ahora
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          availabilityStatus: 'noDisponibleLargoPlazo',
                          available: false,
                        }))
                      }
                      className={`flex-1 py-2 rounded ${
                        formValues.availabilityStatus === 'noDisponibleLargoPlazo'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      No Disponible Largo Plazo
                    </button>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={Object.keys(formErrors).length > 0}
                    className={`${
                      Object.keys(formErrors).length > 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-bold py-2 px-4 rounded`}
                    type="button"
                  >
                    Guardar Producto
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionMenu

/* Fin src\pages\GestionMenu.tsx */
