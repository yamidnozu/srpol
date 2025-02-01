import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  photoUrl?: string
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

const bubbleColors = [
  'bg-pink-100',
  'bg-blue-100',
  'bg-yellow-100',
  'bg-green-100',
  'bg-purple-100',
  'bg-teal-100',
]

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { menu } = useMenu()
  const { user } = useAuth()
  const [numPeople, setNumPeople] = useState<number>(1)
  const [people, setPeople] = useState<Person[]>([])
  const [showPeopleNames, setShowPeopleNames] = useState(false)
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>([])
  const [selectedView, setSelectedView] = useState<string>('shared')
  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null)
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [allFinished, setAllFinished] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showPricesToAll, setShowPricesToAll] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number | null>(null)
  const [tempPersonName, setTempPersonName] = useState<string>('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeFromURL = searchParams.get('code')
  const joiningWithCode = !!codeFromURL
  const { groupOrderId: routeGroupId } = useParams()

  // ─── CREAR LOS REFS DE FORMA INCONDICIONAL ─────────────────────────────
  // Para el SharedOrder (único)
  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null)
  // Para cada PersonOrder, creamos un arreglo de refs:
  const personRefs = useRef<React.RefObject<HTMLDivElement>[]>([])
  if (personRefs.current.length !== people.length) {
    personRefs.current = Array(people.length)
      .fill(null)
      .map(() => React.createRef<HTMLDivElement>())
  }

  // ─── SUSCRIPCIÓN AL PEDIDO GRUPAL ─────────────────────────────────────
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

  // ─── MANEJO DE CAMBIOS ───────────────────────────────────────────────
  const handleNumPeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value)
    setNumPeople(num)
    setPeople((prev) => {
      const currentCount = prev.length
      if (num > currentCount) {
        const newPeople = Array.from({ length: num - currentCount }, (_, i) => ({
          personIndex: currentCount + i,
          userId: null,
          name: `Persona ${currentCount + i + 1}`,
          items: [],
          locked: false,
          finished: false,
        }))
        return [...prev, ...newPeople]
      } else if (num < currentCount) {
        return prev.slice(0, num)
      }
      return prev
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

  const handleAddToSharedOrder = async (item: any) => {
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
      console.error('Error al cambiar cantidad en sharedItems:', error)
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

  const handleAddItemToPerson = async (personIndex: number, menuItem: any) => {
    if (!groupOrderId || orderPlaced || !user) return
    if (menuItem.availabilityStatus !== 'disponible') return

    const personData = people[personIndex]
    const lockedByOther = personData.locked && personData.userId !== user.uid
    if (lockedByOther) return

    let updatedPeople = [...people]
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

    const updated = people.map((p, idx) =>
      idx === personIndex
        ? { ...p, items: p.items.map((it) => (it.id === itemId ? { ...it, quantity } : it)) }
        : p,
    )
    setPeople(updated)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al cambiar cantidad de item en persona:', error)
    }
  }

  const handleRemoveItemFromPerson = async (personIndex: number, itemId: string) => {
    if (!groupOrderId || orderPlaced) return

    const updated = people.map((p, idx) =>
      idx === personIndex ? { ...p, items: p.items.filter((it) => it.id !== itemId) } : p,
    )
    setPeople(updated)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al remover item de persona:', error)
    }
  }

  // ─── Finalizar pedido de persona ─────────────────────────────────
  const handlePersonFinishedOrder = async (personIndex: number) => {
    if (!groupOrderId || orderPlaced || !user) return
    if (!isOwner) {
      const myIndex = people.findIndex((p) => p.userId === user.uid)
      if (myIndex !== personIndex) return
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
      console.error('Error al finalizar pedido de persona:', error)
    }
  }

  const handleNameModalClose = () => {
    setShowNameModal(false)
    setCurrentPersonIndex(null)
  }

  const handleNameSubmit = async (name: string) => {
    if (!groupOrderId || currentPersonIndex === null || !user) return
    const updated = people.map((p, idx) =>
      idx === currentPersonIndex
        ? { ...p, name: name.trim() !== '' ? name : p.name, userId: user.uid, locked: true }
        : p,
    )
    setPeople(updated)
    setShowNameModal(false)
    setCurrentPersonIndex(null)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al actualizar nombre:', error)
    }
  }

  const handleReviewOrder = () => {
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
      console.error('Error al alternar visualización de precios:', error)
    }
  }

  const getSharedItemCount = () => sharedOrderItems.reduce((acc, si) => acc + si.quantity, 0)
  const getPersonItemCount = (person: Person) =>
    person.items.reduce((acc, it) => acc + it.quantity, 0)
  const getInitialLetter = (name: string) =>
    !name || name.trim() === '' ? '?' : name.trim()[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Encabezado */}
      <header className="mb-6 text-center">
        {groupOrderCode && (
          <div>
            <h2 className="text-2xl font-bold text-indigo-600">
              Código de Pedido: <span className="text-3xl">{groupOrderCode}</span>
            </h2>
            <p className="text-sm text-gray-500">Comparte este código con tus amigos</p>
          </div>
        )}
      </header>

      {/* Selección de número de personas y nombres */}
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
          {/* Burbujas para cambiar de vista */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div
              onClick={() => setSelectedView('shared')}
              className="cursor-pointer flex flex-col items-center"
            >
              <div
                className={`relative w-16 h-16 rounded-full ring-4 transition-transform duration-300 flex items-center justify-center ${
                  selectedView === 'shared' ? 'ring-indigo-500 scale-110' : 'ring-gray-300'
                } bg-indigo-100`}
              >
                <span className="text-2xl">🤝</span>
                {getSharedItemCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {getSharedItemCount()}
                  </span>
                )}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">Compartido</span>
            </div>
            {people.map((person, i) => {
              const lockedByOther = person.locked && person.userId !== user?.uid
              const active = selectedView === `person-${i}`
              const color = bubbleColors[i % bubbleColors.length]
              return (
                <div
                  key={person.personIndex}
                  onClick={() => setSelectedView(`person-${i}`)}
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div
                    className={`relative w-16 h-16 rounded-full transition-transform duration-300 flex items-center justify-center ${
                      active ? 'ring-indigo-500 scale-110' : 'ring-gray-300'
                    } ${color}`}
                  >
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
                    {lockedByOther && (
                      <span className="absolute top-0 left-0 text-red-500 text-lg">🔒</span>
                    )}
                    {person.finished && (
                      <span className="absolute bottom-0 right-0 text-green-500 text-lg font-bold">
                        ✅
                      </span>
                    )}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700 max-w-[4rem] truncate">
                    {person.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Sección de vista según selección */}
          {selectedView === 'shared' ? (
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
                  {} as Record<string, any[]>,
                )}
              sharedOrderItems={sharedOrderItems}
              onAddToSharedOrder={handleAddToSharedOrder}
              onSharedOrderItemQuantityChange={handleSharedOrderItemQuantityChange}
              onRemoveSharedOrderItem={handleRemoveSharedOrderItem}
              calculateSharedSubtotal={() =>
                sharedOrderItems.reduce((sum, si) => {
                  const menuItem = menu.find((m) => m.id === si.itemId)
                  return menuItem ? sum + menuItem.price * si.quantity : sum
                }, 0)
              }
              sharedOrderSummaryRef={sharedOrderSummaryRef}
              activeTab={selectedView}
              menu={menu}
              disabled={orderPlaced}
            />
          ) : (
            people.map((person, i) => {
              if (selectedView === `person-${i}`) {
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
                        {} as Record<string, any[]>,
                      )}
                    menu={menu}
                    onAddItemToPerson={handleAddItemToPerson}
                    onPersonOrderItemQuantityChange={handlePersonOrderItemQuantityChange}
                    onRemoveItemFromPerson={handleRemoveItemFromPerson}
                    calculateSubtotal={(personItems) =>
                      personItems.reduce((total, it) => {
                        const menuItem = menu.find((m) => m.id === it.id)
                        return menuItem ? total + menuItem.price * it.quantity : total
                      }, 0)
                    }
                    personOrderSummaryRef={personRefs.current[i]}
                    activeTab={selectedView}
                    onPersonFinishedOrder={handlePersonFinishedOrder}
                    isFinished={person.finished || false}
                    personLocked={person.locked || false}
                    isCurrentUserTab={person.userId === user?.uid}
                    personIndex={i}
                    disabled={lockedByOther || orderPlaced}
                  />
                )
              }
              return null
            })
          )}

          {/* Botón para revisar el pedido grupal (solo visible para el creador) */}
          <div className="flex justify-center mt-8">
            {isOwner && allFinished && !orderPlaced ? (
              <button
                onClick={handleReviewOrder}
                disabled={orderPlaced}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300"
              >
                ¡Revisar Pedido Grupal! ✅
              </button>
            ) : isOwner && orderPlaced ? (
              <p className="text-center text-green-600 font-semibold">
                Pedido realizado. Revisando resumen...
              </p>
            ) : !isOwner ? (
              <p className="text-center text-gray-600">
                Solo el creador del pedido puede finalizar pedidos de otros.
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
          calculateSharedSubtotal={() =>
            sharedOrderItems.reduce((sum, si) => {
              const menuItem = menu.find((m) => m.id === si.itemId)
              return menuItem ? sum + menuItem.price * si.quantity : sum
            }, 0)
          }
          calculateSubtotal={(personItems) =>
            personItems.reduce((total, it) => {
              const menuItem = menu.find((m) => m.id === it.id)
              return menuItem ? total + menuItem.price * it.quantity : total
            }, 0)
          }
          isOrderOwner={isOwner}
          onOrderPlaced={handleOrderPlacement}
          orderPlaced={orderPlaced}
          showPricesToAll={showPricesToAll}
          onToggleShowPrices={handleToggleShowPrices}
        />
      )}

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
