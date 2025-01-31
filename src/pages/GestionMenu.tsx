// src/pages/GestionMenu.tsx

import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { MenuItem as MenuItemType } from '../context/AppContext'
import { COLLECTIONS } from '../utils/constants'
import { db } from '../utils/firebase'

// Valores iniciales para el formulario
const initialFormValues: Partial<MenuItemType> = {
  name: '',
  description: '',
  price: 0,
  cost: 0,
  imageUrls: [], // Campo para múltiples imágenes (array de URLs)
  available: true,
  recommendation: '',
  observations: '',
  availabilityStatus: 'disponible',
}

const GestionMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [formValues, setFormValues] = useState<Partial<MenuItemType>>(initialFormValues)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Cargar ítems desde Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.MENU))
      const items: MenuItemType[] = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as MenuItemType,
      )
      setMenuItems(items)
      setLoading(false)
    }
    fetchMenu()
  }, [])

  // Manejo de cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormValues((prev) => ({
      ...prev,
      // Si el campo es numérico (price o cost) se convierte a Number
      [name]: name === 'price' || name === 'cost' ? Number(value) : value,
    }))
  }

  // Para las imágenes se usa un input de texto que acepta URLs separadas por comas
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const urls = value
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url !== '')
    setFormValues((prev) => ({
      ...prev,
      imageUrls: urls,
    }))
  }

  // Abrir modal para agregar un nuevo ítem
  const openAddModal = () => {
    setFormValues(initialFormValues)
    setEditingItem(null)
    setModalOpen(true)
  }

  // Abrir modal para editar un ítem existente
  const openEditModal = (item: MenuItemType) => {
    setEditingItem(item)
    setFormValues(item)
    setModalOpen(true)
  }

  // Eliminar un ítem con confirmación
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

  // Guardar (agregar o editar) un ítem
  const handleSave = async () => {
    if (!formValues.name) {
      setAlert({ type: 'error', message: 'El nombre es obligatorio' })
      return
    }
    try {
      if (editingItem) {
        // Actualizar ítem
        await updateDoc(doc(db, COLLECTIONS.MENU, editingItem.id), formValues)
        setMenuItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ? ({ ...i, ...formValues } as MenuItemType) : i,
          ),
        )
        setAlert({ type: 'success', message: 'Item actualizado correctamente' })
      } else {
        // Agregar nuevo ítem
        const docRef = await addDoc(collection(db, COLLECTIONS.MENU), formValues)
        setMenuItems((prev) => [...prev, { id: docRef.id, ...formValues } as MenuItemType])
        setAlert({ type: 'success', message: 'Item agregado correctamente' })
      }
      setModalOpen(false)
    } catch (error) {
      console.error(error)
      setAlert({ type: 'error', message: 'Error al guardar el item' })
    }
  }

  // Marcar ítem como no disponible (corto o largo plazo)
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
    } catch (error) {
      console.error(error)
      setAlert({ type: 'error', message: 'Error al actualizar la disponibilidad' })
    }
  }

  const closeAlert = () => {
    setAlert(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Menú</h1>
      </header>

      {alert && (
        <div
          className={`mb-4 p-3 rounded ${
            alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          } flex items-center justify-between`}
        >
          <span>{alert.message}</span>
          <button onClick={closeAlert} className="font-bold text-xl">
            &times;
          </button>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={openAddModal}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Agregar Item
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Cargando menú...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <Carousel images={item.imageUrls || []} />
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
                  <span className="text-gray-900">
                    {item.price
                      ? item.price.toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                        })
                      : '-'}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-medium text-gray-700">Costo:</span>{' '}
                  <span className="text-gray-900">
                    {item.cost
                      ? item.cost.toLocaleString('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                        })
                      : '-'}
                  </span>
                </div>
                {item.recommendation && (
                  <p className="mt-2 text-sm text-gray-500">Recomendación: {item.recommendation}</p>
                )}
                {item.observations && (
                  <p className="mt-1 text-sm text-gray-500">Observaciones: {item.observations}</p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => openEditModal(item)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => handleMarkUnavailable(item, 'noDisponibleMomento')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs"
                  >
                    No Disponible Ahora
                  </button>
                  <button
                    onClick={() => handleMarkUnavailable(item, 'noDisponibleLargoPlazo')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                  >
                    No Disponible Largo Plazo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Agregar/Editar Ítem */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 transform transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingItem ? 'Editar Item' : 'Agregar Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  name="description"
                  value={formValues.description || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <input
                    type="number"
                    name="price"
                    value={formValues.price || 0}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Costo</label>
                  <input
                    type="number"
                    name="cost"
                    value={formValues.cost || 0}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Imágenes (URLs, separadas por comas)
                </label>
                <input
                  type="text"
                  name="images"
                  value={(formValues.imageUrls || []).join(', ')}
                  onChange={handleImagesChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <input
                    type="text"
                    name="observations"
                    value={formValues.observations || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disponibilidad</label>
                <select
                  name="availabilityStatus"
                  value={formValues.availabilityStatus || 'disponible'}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="disponible">Disponible</option>
                  <option value="noDisponibleMomento">No Disponible Ahora</option>
                  <option value="noDisponibleLargoPlazo">No Disponible Largo Plazo</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente Carousel para mostrar múltiples imágenes en cada tarjeta
interface CarouselProps {
  images: string[]
}
const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [current, setCurrent] = useState(0)
  if (images.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">Sin imagen</span>
      </div>
    )
  }
  const next = () => setCurrent((prev) => (prev + 1) % images.length)
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length)
  return (
    <div className="relative">
      <img src={images[current]} alt="Producto" className="w-full h-48 object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50 transition"
          >
            &#10094;
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50 transition"
          >
            &#10095;
          </button>
        </>
      )}
    </div>
  )
}

export default GestionMenu
