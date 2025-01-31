/* src/components/menu/GroupOrderPage.tsx */
/* Versión con burbujas coloridas y posibilidad de ver el contenido aunque esté bloqueado */
/* Se asume que si person.photoUrl existe, la mostramos; sino, mostramos la primera letra del nombre */

import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MenuItem as MenuItemType } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { useMenu } from '../../hooks/useMenu'
import { COLLECTIONS } from '../../utils/constants'
import { db } from '../../utils/firebase'
import NameModal from './NameModal'
import OrderReview from './partials/OrderReview'
import PeopleSelection from './partials/PeopleSelection'
import PersonOrder from './partials/PersonOrder'
import SharedOrder from './partials/SharedOrder'

export interface Person {
  personIndex: number
  userId: string | null
  name: string
  items: { id: string; quantity: number }[]
  locked?: boolean
  finished?: boolean
  photoUrl?: string // Ejemplo: si la tienes en la BD
}

export interface SharedOrderItem {
  itemId: string
  quantity: number
  personIds: string[]
}

interface GroupOrderData {
  code: string
  ownerId: string
  status: string
  participants: Person[]
  sharedItems: SharedOrderItem[]
  orderPlaced?: boolean
  allFinished?: boolean
  showPricesToAll?: boolean
}

export interface GroupOrderPageProps {
  name: string
}

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { menu } = useMenu()
  const { user } = useAuth()
  const [numPeople, setNumPeople] = useState<number>(1)
  const [people, setPeople] = useState<Person[]>([])
  const [showPeopleNames, setShowPeopleNames] = useState(false)
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>([])
  const [selectedView, setSelectedView] = useState<string>('shared') // "shared" o "person-N"

  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null)
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [allFinished, setAllFinished] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showPricesToAll, setShowPricesToAll] = useState(false)

  const [tempPersonName, setTempPersonName] = useState<string>('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeFromURL = searchParams.get('code')
  const joiningWithCode = !!codeFromURL

  // Refs para scrollear si deseas
  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null)
  const personOrderSummaryRef = useRef<HTMLDivElement>(null)

  // Obtenemos la ID de la ruta
  const { groupOrderId: routeGroupId } = useParams()

  // Colores para las burbujas (así cada persona tiene un color distinto)
  const bubbleColors = [
    'bg-pink-100',
    'bg-blue-100',
    'bg-yellow-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-teal-100',
  ]

  // -------------------- EFECTOS --------------------
  useEffect(() => {
    if (routeGroupId) {
      setGroupOrderId(routeGroupId)
      setGroupOrderCode(codeFromURL)
      subscribeToGroupOrder(routeGroupId)
    } else {
      console.log('No se encontró groupOrderId en la ruta')
    }
  }, [routeGroupId, codeFromURL])

  const subscribeToGroupOrder = (groupId: string) => {
    const ref = doc(db, COLLECTIONS.GROUP_ORDERS, groupId)
    return onSnapshot(
      ref,
      (docSnap) => {
        if (!docSnap.exists()) {
          navigate('/menu')
          return
        }
        const data = docSnap.data() as GroupOrderData
        setGroupOrderCode(data.code)
        setPeople(data.participants)
        setSharedOrderItems(data.sharedItems)
        setIsOwner(user?.uid === data.ownerId)
        setAllFinished(data.participants.every((p) => p.finished))
        setOrderPlaced(!!data.orderPlaced)
        setShowPricesToAll(!!data.showPricesToAll)

        if (data.participants.length !== numPeople) {
          setNumPeople(data.participants.length)
        }
        if (data.orderPlaced) {
          setShowPedidoForm(true)
        }
      },
      () => {
        navigate('/menu')
      },
    )
  }

  // -------------------- HANDLERS & LOGIC --------------------
  const handleNumPeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value)
    setNumPeople(num)

    setPeople((prev) => {
      const currentCount = prev.length
      if (num > currentCount) {
        // Agregar personas
        const newOnes = Array.from({ length: num - currentCount }, (_, i) => ({
          personIndex: currentCount + i,
          userId: null,
          name: `Persona ${currentCount + i + 1}`,
          items: [],
          locked: false,
          finished: false,
        }))
        return [...prev, ...newOnes]
      } else if (num < currentCount) {
        // Eliminar
        return prev.slice(0, num)
      } else {
        return prev
      }
    })
  }

  const handlePersonNameChange = (index: number, name: string) => {
    const updated = [...people]
    if (updated[index]) {
      updated[index].name = name
      setPeople(updated)
    }
  }

  const handleStartOrder = () => {
    if (people.every((p) => p.name.trim() !== '')) {
      setShowPeopleNames(true)
      setSelectedView('shared')
    } else {
      alert('Por favor ingresa el nombre de cada persona')
    }
  }

  // --- Funciones para Items Compartidos ---
  const handleAddToSharedOrder = async (item: MenuItemType) => {
    if (!groupOrderId || orderPlaced) return
    if (item.availabilityStatus !== 'disponible') return

    const existingIndex = sharedOrderItems.findIndex((si) => si.itemId === item.id)
    let updated: SharedOrderItem[]
    if (existingIndex >= 0) {
      updated = sharedOrderItems.map((si, idx) =>
        idx === existingIndex ? { ...si, quantity: si.quantity + 1 } : si,
      )
    } else {
      updated = [...sharedOrderItems, { itemId: item.id, quantity: 1, personIds: [] }]
    }
    setSharedOrderItems(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        sharedItems: updated,
      })
    } catch (error) {
      console.error('Error al actualizar sharedItems:', error)
    }
  }

  const handleSharedOrderItemQuantityChange = async (itemId: string, quantity: number) => {
    if (!groupOrderId || orderPlaced) return
    if (quantity < 0) return

    const updated = sharedOrderItems.map((si) => (si.itemId === itemId ? { ...si, quantity } : si))
    setSharedOrderItems(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        sharedItems: updated,
      })
    } catch (error) {
      console.error('Error al cambiar qty en sharedItems:', error)
    }
  }

  const handleRemoveSharedOrderItem = async (itemId: string) => {
    if (!groupOrderId || orderPlaced) return

    const updated = sharedOrderItems.filter((si) => si.itemId !== itemId)
    setSharedOrderItems(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        sharedItems: updated,
      })
    } catch (error) {
      console.error('Error al remover item compartido:', error)
    }
  }

  // --- Funciones para Items de Persona ---
  const handleAddItemToPerson = async (personIndex: number, menuItem: MenuItemType) => {
    if (!groupOrderId || orderPlaced || !user) return
    if (menuItem.availabilityStatus !== 'disponible') return

    const personData = people[personIndex]
    const lockedByOther = personData.locked && personData.userId !== user.uid
    if (lockedByOther) {
      // Está bloqueada por otro, podemos ver, pero no agregar
      return
    }

    // Si no está bloqueada o es mía, puedo agregar
    let updatedPeople = [...people]

    // Bloquear la persona si no lo está
    if (!personData.locked) {
      if (personData.name.startsWith('Persona')) {
        setCurrentPersonIndex(personIndex)
        setTempPersonName(personData.name)
        setShowNameModal(true)
      }
      updatedPeople = updatedPeople.map((p, idx) =>
        idx === personIndex ? { ...p, userId: user.uid, locked: true } : p,
      )
    }

    // Agregar el ítem
    updatedPeople = updatedPeople.map((p, idx) => {
      if (idx === personIndex) {
        const foundItem = p.items.find((it) => it.id === menuItem.id)
        if (foundItem) {
          return {
            ...p,
            items: p.items.map((it) =>
              it.id === menuItem.id ? { ...it, quantity: it.quantity + 1 } : it,
            ),
          }
        } else {
          return { ...p, items: [...p.items, { id: menuItem.id, quantity: 1 }] }
        }
      }
      return p
    })
    setPeople(updatedPeople)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updatedPeople,
      })
    } catch (error) {
      console.error('Error al agregar item a persona:', error)
    }
  }

  const handlePersonOrderItemQuantityChange = async (
    personIndex: number,
    itemId: string,
    quantity: number,
  ) => {
    if (!groupOrderId || orderPlaced) return
    if (quantity < 0) return

    const updated = people.map((p, idx) => {
      if (idx === personIndex) {
        return {
          ...p,
          items: p.items.map((it) => (it.id === itemId ? { ...it, quantity } : it)),
        }
      }
      return p
    })
    setPeople(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al cambiar cantidad de item persona:', error)
    }
  }

  const handleRemoveItemFromPerson = async (personIndex: number, itemId: string) => {
    if (!groupOrderId || orderPlaced) return

    const updated = people.map((p, idx) => {
      if (idx === personIndex) {
        return {
          ...p,
          items: p.items.filter((it) => it.id !== itemId),
        }
      }
      return p
    })
    setPeople(updated)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al remover item de persona:', error)
    }
  }

  const handlePersonFinishedOrder = async (personIndex: number) => {
    if (!groupOrderId || orderPlaced || !user) return
    const myIndex = people.findIndex((p) => p.userId === user.uid)
    if (myIndex !== personIndex) {
      // No puedes terminar si no es tuya
      return
    }

    const updated = people.map((p, idx) => (idx === personIndex ? { ...p, finished: true } : p))
    setPeople(updated)
    const everyoneDone = updated.every((p) => p.finished)
    setAllFinished(everyoneDone)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
        allFinished: everyoneDone,
      })
    } catch (error) {
      console.error('Error al terminar persona:', error)
    }
  }

  // --- Modal para cambiar nombre ---
  const handleNameModalClose = () => {
    setShowNameModal(false)
    setCurrentPersonIndex(null)
  }

  const handleNameSubmit = async (name: string) => {
    if (!groupOrderId || currentPersonIndex === null || !user) return

    const updated = people.map((p, idx) => {
      if (idx === currentPersonIndex) {
        const finalName = name.trim() !== '' ? name : p.name
        return {
          ...p,
          name: finalName,
          userId: user.uid,
          locked: true,
        }
      }
      return p
    })
    setPeople(updated)
    setShowNameModal(false)
    setCurrentPersonIndex(null)

    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al actualizar con nombre:', error)
    }
  }

  // --- Revisión final ---
  const handleReviewOrder = () => {
    // Si deseas hacer algo con los items compartidos
    setShowPedidoForm(true)
  }

  const handleOrderPlacement = async () => {
    if (!groupOrderId) return
    await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), { orderPlaced: true })
    setOrderPlaced(true)
    setShowPedidoForm(true)
  }

  const handleToggleShowPrices = async () => {
    if (!groupOrderId) return
    const newVal = !showPricesToAll
    setShowPricesToAll(newVal)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        showPricesToAll: newVal,
      })
    } catch (error) {
      console.error('Error toggling showPricesToAll:', error)
    }
  }

  // --- Cálculos ---
  const calculateSubtotal = (personItems: { id: string; quantity: number }[]) => {
    let total = 0
    personItems.forEach((it) => {
      const found = menu.find((m) => m.id === it.id)
      if (found) total += found.price * it.quantity
    })
    return total
  }

  const calculateSharedSubtotal = () => {
    return sharedOrderItems.reduce((sum, si) => {
      const found = menu.find((m) => m.id === si.itemId)
      return found ? sum + found.price * si.quantity : sum
    }, 0)
  }

  // --- Helpers Avatares ---
  const getSharedItemCount = () => sharedOrderItems.reduce((acc, si) => acc + si.quantity, 0)

  const getPersonItemCount = (person: Person) =>
    person.items.reduce((acc, it) => acc + it.quantity, 0)

  // Retorna la primera letra del nombre (o "?")
  const getInitialLetter = (name: string) => {
    if (!name || name.trim() === '') return '?'
    return name.trim()[0].toUpperCase()
  }

  // --- Render ---
  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        ¡Pedido Grupal con Burbujas! 🎉
      </h1>

      {/* Muestra código si existe */}
      {groupOrderCode && (
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Código de Pedido: <span className="text-indigo-600 font-bold">{groupOrderCode}</span>
          </h3>
          <p className="text-sm text-gray-500">Compártelo con tus amigos</p>
        </div>
      )}

      {/* Si no hemos inicializado los nombres y no venimos con un code */}
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
          {/* ============ Burbujas/Avatares arriba ============ */}
          <div className="flex flex-wrap gap-4 items-center justify-center mb-8">
            {/* Compartido */}
            <div
              className="flex flex-col items-center space-y-1 cursor-pointer"
              onClick={() => setSelectedView('shared')}
            >
              <div
                className={`relative w-16 h-16 rounded-full ring-4 flex items-center justify-center 
                  ${
                    selectedView === 'shared' ? 'ring-indigo-500' : 'ring-gray-300'
                  } bg-indigo-100 transition-transform hover:scale-105`}
              >
                {/* Icono o inicial para 'compartido' */}
                <span className="text-sm font-semibold text-gray-700">🤝</span>
                {/* Badge con total de items si > 0 */}
                {getSharedItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {getSharedItemCount()}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">Compartido</span>
            </div>

            {/* Burbujas para cada persona */}
            {people.map((person, index) => {
              const lockedByOther = person.locked && person.userId !== user?.uid
              const active = selectedView === `person-${index}`
              const itemCount = getPersonItemCount(person)
              const color = bubbleColors[index % bubbleColors.length]

              return (
                <div
                  key={person.personIndex}
                  className="flex flex-col items-center space-y-1 cursor-pointer"
                  onClick={() => setSelectedView(`person-${index}`)}
                >
                  {/* Avatar circular */}
                  <div
                    className={`relative w-16 h-16 rounded-full ring-4 flex items-center justify-center 
                      ${
                        active ? 'ring-indigo-500' : 'ring-gray-300'
                      } ${color} transition-transform hover:scale-105`}
                  >
                    {/* Si person.photoUrl existe, mostramos foto */}
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-700">
                        {getInitialLetter(person.name)}
                      </span>
                    )}
                    {/* Badge de items */}
                    {itemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {itemCount}
                      </span>
                    )}
                    {/* Si locked by other => icono candado */}
                    {lockedByOther && (
                      <span className="absolute top-0 left-0 text-red-500 text-lg">🔒</span>
                    )}
                    {/* Si finished => check en esquina inferior */}
                    {person.finished && (
                      <span className="absolute bottom-0 right-0 text-green-500 text-lg font-bold">
                        ✅
                      </span>
                    )}
                  </div>

                  {/* Nombre debajo del avatar */}
                  <span className="text-sm font-medium text-gray-700 text-center max-w-[4rem] truncate">
                    {person.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ============ Sección "Compartido" o "PersonOrder" ============ */}
          {selectedView === 'shared' && (
            <SharedOrder
              menuCategories={menu
                .filter((i) => i.availabilityStatus !== 'noDisponibleLargoPlazo')
                .reduce(
                  (acc, item) => {
                    const cat = item.recommendation || 'General'
                    acc[cat] = acc[cat] || []
                    acc[cat].push(item)
                    return acc
                  },
                  {} as Record<string, MenuItemType[]>,
                )}
              sharedOrderItems={sharedOrderItems}
              onAddToSharedOrder={handleAddToSharedOrder}
              onSharedOrderItemQuantityChange={handleSharedOrderItemQuantityChange}
              onRemoveSharedOrderItem={handleRemoveSharedOrderItem}
              calculateSharedSubtotal={calculateSharedSubtotal}
              sharedOrderSummaryRef={sharedOrderSummaryRef}
              activeTab={selectedView}
              menu={menu}
              disabled={orderPlaced}
            />
          )}

          {people.map((person, i) => {
            if (selectedView === `person-${i}`) {
              // Para saber si está bloqueada por otro => disabled
              const lockedByOther = person.locked && person.userId !== user?.uid
              return (
                <PersonOrder
                  key={person.personIndex}
                  person={person}
                  index={i}
                  menuCategories={menu
                    .filter((m) => m.availabilityStatus !== 'noDisponibleLargoPlazo')
                    .reduce(
                      (acc, item) => {
                        const cat = item.recommendation || 'General'
                        acc[cat] = acc[cat] || []
                        acc[cat].push(item)
                        return acc
                      },
                      {} as Record<string, MenuItemType[]>,
                    )}
                  menu={menu}
                  onAddItemToPerson={handleAddItemToPerson}
                  onPersonOrderItemQuantityChange={handlePersonOrderItemQuantityChange}
                  onRemoveItemFromPerson={handleRemoveItemFromPerson}
                  calculateSubtotal={calculateSubtotal}
                  personOrderSummaryRef={personOrderSummaryRef}
                  activeTab={selectedView}
                  onPersonFinishedOrder={handlePersonFinishedOrder}
                  isFinished={person.finished || false}
                  personLocked={person.locked || false}
                  isCurrentUserTab={person.userId === user?.uid}
                  personIndex={i}
                  disabled={lockedByOther || orderPlaced} // Ver o no, pero sin poder editar si locked por otro
                />
              )
            }
            return null
          })}

          {/* Botón para REVISAR si soy el owner y todos terminaron */}
          <div className="flex justify-center mt-8">
            {isOwner && allFinished && !orderPlaced ? (
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none transition-colors duration-300"
                onClick={handleReviewOrder}
                disabled={orderPlaced}
              >
                ¡Revisar Pedido Grupal! ✅
              </button>
            ) : isOwner && orderPlaced ? (
              <p className="text-center text-green-600 font-semibold">
                Pedido realizado. Revisando resumen...
              </p>
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
        // Resumen final
        <OrderReview
          people={people}
          sharedOrderItems={sharedOrderItems}
          menu={menu}
          onClosePedidoForm={() => setShowPedidoForm(false)}
          calculateSharedSubtotal={calculateSharedSubtotal}
          calculateSubtotal={calculateSubtotal}
          isOrderOwner={isOwner}
          onOrderPlaced={handleOrderPlacement}
          orderPlaced={orderPlaced}
          showPricesToAll={showPricesToAll}
          onToggleShowPrices={handleToggleShowPrices}
        />
      )}

      {/* Modal para nombre de Persona */}
      <NameModal
        open={showNameModal}
        onClose={handleNameModalClose}
        currentName={tempPersonName}
        onSubmit={handleNameSubmit}
      />
    </div>
  )
}

export default GroupOrderPage
