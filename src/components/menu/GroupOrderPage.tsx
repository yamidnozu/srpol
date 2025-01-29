/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* src/components/menu/GroupOrderPage.tsx */
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
}

export interface SharedOrderItem {
  itemId: string
  quantity: number
  personIds: string[]
}

export interface GroupOrderPageProps {
  name: string
}

/** Estructura (aprox) en Firestore de groupOrders */
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

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { menu } = useMenu()
  const { user } = useAuth()
  const [numPeople, setNumPeople] = useState<number>(1)
  const [people, setPeople] = useState<Person[]>([])
  const [showPeopleNames, setShowPeopleNames] = useState(false)
  const [showPedidoForm, setShowPedidoForm] = useState(false)
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('shared')
  const [feedbackMessage] = useState<string>('')

  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null)
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [allFinished, setAllFinished] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  // Para visibilidad de precios
  const [showPricesToAll, setShowPricesToAll] = useState(false)

  const [tempPersonName, setTempPersonName] = useState<string>('')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeFromURL = searchParams.get('code')
  const joiningWithCode = !!codeFromURL

  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null)
  const personOrderSummaryRef = useRef<HTMLDivElement>(null)
  const [, setIsMobile] = useState(false)
  const [, setIsSummaryVisible] = useState(true)

  const { groupOrderId: routeGroupId } = useParams()

  useEffect(() => {
    if (routeGroupId) {
      setGroupOrderId(routeGroupId)
      setGroupOrderCode(codeFromURL)
      subscribeToGroupOrder(routeGroupId)
    } else {
      console.log('GroupOrderPage - No routeGroupId, not subscribing to group order.')
    }
  }, [routeGroupId, codeFromURL])

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768
    setIsMobile(checkMobile())
    const handleResize = () => setIsMobile(checkMobile())
    window.addEventListener('resize', handleResize)
    setIsSummaryVisible(!checkMobile())
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const subscribeToGroupOrder = (groupId: string) => {
    if (!groupId) return
    const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupId)

    return onSnapshot(
      groupOrderDocRef,
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          navigate('/menu')
          return
        }
        const groupOrderData = docSnapshot.data() as GroupOrderData

        setGroupOrderCode(groupOrderData.code)
        setPeople(groupOrderData.participants)
        setSharedOrderItems(groupOrderData.sharedItems)
        setIsOwner(user?.uid === groupOrderData.ownerId)
        setAllFinished(groupOrderData.participants.every((p) => p.finished))
        setOrderPlaced(!!groupOrderData.orderPlaced)

        // Sincronizamos showPricesToAll
        setShowPricesToAll(!!groupOrderData.showPricesToAll)

        // Ajustamos numPeople para que coincida
        const participantsList = groupOrderData.participants
        if (participantsList && participantsList.length && participantsList.length !== numPeople) {
          setNumPeople(participantsList.length)
        }

        // Si ya se marcó que el pedido fue realizado, mostramos la revisión
        if (groupOrderData.orderPlaced) {
          setShowPedidoForm(true)
        }
      },
      () => {
        // On error => volver a /menu
        navigate('/menu')
      },
    )
  }

  const handleNumPeopleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(event.target.value)
    setNumPeople(num)
    setPeople((prevPeople) => {
      const currentPeopleCount = prevPeople.length
      if (num > currentPeopleCount) {
        const newPeople = Array.from({ length: num - currentPeopleCount }, (_, index) => ({
          personIndex: currentPeopleCount + index,
          userId: null,
          name: `Persona ${currentPeopleCount + index + 1}`,
          items: [],
          locked: false,
          finished: false,
        }))
        return [...prevPeople, ...newPeople]
      } else if (num < currentPeopleCount) {
        return prevPeople.slice(0, num)
      } else {
        return prevPeople
      }
    })
  }

  const handlePersonNameChange = (index: number, name: string) => {
    const updatedPeople = [...people]
    if (updatedPeople[index]) {
      updatedPeople[index].name = name
      setPeople(updatedPeople)
    }
  }

  const handleStartOrder = () => {
    if (people.every((person) => person.name.trim() !== '')) {
      setShowPeopleNames(true)
      setActiveTab('shared')
    } else {
      alert('Por favor, ingresa el nombre de cada persona.')
    }
  }

  const handleAddToSharedOrder = async (item: MenuItemType) => {
    if (orderPlaced || !groupOrderId) return
    if (item.availabilityStatus !== 'disponible') return

    const existingItemIndex = sharedOrderItems.findIndex(
      (sharedItem) => sharedItem.itemId === item.id,
    )
    let updatedSharedOrderItems: SharedOrderItem[]
    if (existingItemIndex > -1) {
      updatedSharedOrderItems = sharedOrderItems.map((si, index) =>
        index === existingItemIndex ? { ...si, quantity: si.quantity + 1 } : si,
      )
    } else {
      updatedSharedOrderItems = [
        ...sharedOrderItems,
        { itemId: item.id, quantity: 1, personIds: [] },
      ]
    }
    setSharedOrderItems(updatedSharedOrderItems)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      })
    } catch (error) {
      console.error('Error al actualizar items compartidos:', error)
    }
  }

  const handleSharedOrderItemQuantityChange = async (itemId: string, quantity: number) => {
    if (orderPlaced || !groupOrderId) return
    if (quantity < 0) return

    const updatedSharedOrderItems = sharedOrderItems.map((sharedItem) =>
      sharedItem.itemId === itemId ? { ...sharedItem, quantity } : sharedItem,
    )
    setSharedOrderItems(updatedSharedOrderItems)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      })
    } catch (error) {
      console.error('Error actualizando sharedOrderItems:', error)
    }
  }

  const handleRemoveSharedOrderItem = async (itemId: string) => {
    if (orderPlaced || !groupOrderId) return

    const updatedSharedOrderItems = sharedOrderItems.filter((item) => item.itemId !== itemId)
    setSharedOrderItems(updatedSharedOrderItems)
    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        sharedItems: updatedSharedOrderItems,
      })
    } catch (error) {
      console.error('Error al remover item compartido:', error)
    }
  }

  const handleAddItemToPerson = async (personIndex: number, menuItem: MenuItemType) => {
    if (orderPlaced || !groupOrderId || !user) return

    const currentPerson = people[personIndex]
    // Chequeo de lock
    if (currentPerson.locked && currentPerson.userId !== user.uid) {
      alert('Esta pestaña está siendo usada por otra persona')
      return
    }

    let updatedParticipants = [...people]
    // Si no está bloqueada, bloquear
    if (!currentPerson.locked) {
      if (currentPerson.name.startsWith('Persona')) {
        setCurrentPersonIndex(personIndex)
        setTempPersonName(currentPerson.name)
        setShowNameModal(true)
      }
      updatedParticipants = updatedParticipants.map((p, idx) =>
        idx === personIndex ? { ...p, userId: user.uid, locked: true } : p,
      )
    }

    // Insert item si está disponible
    if (menuItem.availabilityStatus !== 'disponible') {
      return
    }
    updatedParticipants = updatedParticipants.map((p, idx) => {
      if (idx === personIndex) {
        const itemExists = p.items.some((orderItem) => orderItem.id === menuItem.id)
        if (itemExists) {
          return {
            ...p,
            items: p.items.map((orderItem) =>
              orderItem.id === menuItem.id
                ? { ...orderItem, quantity: orderItem.quantity + 1 }
                : orderItem,
            ),
          }
        } else {
          return {
            ...p,
            items: [...p.items, { id: menuItem.id, quantity: 1 }],
          }
        }
      }
      return p
    })

    setPeople(updatedParticipants)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        participants: updatedParticipants,
      })
    } catch (error) {
      console.error('Firestore update FAILED', error)
    }
  }

  const handlePersonOrderItemQuantityChange = async (
    personIndex: number,
    itemId: string,
    quantity: number,
  ) => {
    if (orderPlaced || !groupOrderId) return
    if (quantity < 0) return

    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return {
          ...person,
          items: person.items.map((it) => (it.id === itemId ? { ...it, quantity } : it)),
        }
      }
      return person
    })
    setPeople(updatedParticipants)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants })
    } catch (error) {
      console.error('Error actualizando cantidad de item de persona:', error)
    }
  }

  const handleRemoveItemFromPerson = async (personIndex: number, itemId: string) => {
    if (orderPlaced || !groupOrderId) return

    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return {
          ...person,
          items: person.items.filter((item) => item.id !== itemId),
        }
      }
      return person
    })
    setPeople(updatedParticipants)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants })
    } catch (error) {
      console.error('Error al remover item de persona:', error)
    }
  }

  const handleClaimPersonTab = async (personIndex: number) => {
    if (orderPlaced || !groupOrderId || !user) return

    const currentPerson = people[personIndex]
    if (currentPerson.locked && currentPerson.userId !== user.uid) {
      alert('Esta pestaña ya está siendo usada por otra persona')
      return
    }

    if (currentPerson.name.startsWith('Persona ')) {
      setCurrentPersonIndex(personIndex)
      setTempPersonName(currentPerson.name)
      setShowNameModal(true)
      return
    }

    const updatedParticipants = people.map((p, idx) =>
      idx === personIndex ? { ...p, userId: user.uid, locked: true } : p,
    )
    setPeople(updatedParticipants)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants })
    } catch (error) {
      console.error('Error al bloquear pestaña para el usuario:', error)
    }
  }

  const handlePersonFinishedOrder = async (personIndex: number) => {
    if (orderPlaced || !groupOrderId || !user) return

    const currentUserPersonIndex = people.findIndex((p) => p.userId === user.uid)
    if (currentUserPersonIndex !== personIndex) {
      alert('No puedes terminar el pedido de otra persona.')
      return
    }

    const updatedParticipants = people.map((person, index) => {
      if (index === personIndex) {
        return { ...person, finished: true }
      }
      return person
    })
    setPeople(updatedParticipants)
    const allAreFinished = updatedParticipants.every((p) => p.finished)
    setAllFinished(allAreFinished)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        participants: updatedParticipants,
        allFinished: allAreFinished,
      })
    } catch (error) {
      console.error('Error al marcar persona como finished:', error)
    }
  }

  const handleNameModalClose = () => {
    setShowNameModal(false)
    setCurrentPersonIndex(null)
  }

  const handleNameSubmit = async (name: string) => {
    if (!groupOrderId || currentPersonIndex === null || !user) return

    const updatedParticipants = people.map((person, index) => {
      if (index === currentPersonIndex) {
        const finalName = name.trim() !== '' ? name : person.name
        return {
          ...person,
          name: finalName,
          userId: user.uid,
          locked: true,
        }
      }
      return person
    })
    setPeople(updatedParticipants)
    setShowNameModal(false)
    setCurrentPersonIndex(null)

    try {
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, { participants: updatedParticipants })
    } catch (error) {
      console.error('Error al actualizar con el nombre en Firestore:', error)
    }
  }

  const distributeSharedOrderItems = () => {
    /* Lógica si se quiere implementar */
  }

  const handleReviewOrder = () => {
    distributeSharedOrderItems()
    setShowPedidoForm(true)
  }

  const handleOrderPlacement = async () => {
    if (!groupOrderId) return
    const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
    await updateDoc(groupOrderDocRef, { orderPlaced: true })
    setShowPedidoForm(true)
  }

  const handleToggleShowPrices = async () => {
    if (!groupOrderId) return
    try {
      const newValue = !showPricesToAll
      setShowPricesToAll(newValue)
      const groupOrderDocRef = doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId)
      await updateDoc(groupOrderDocRef, {
        showPricesToAll: newValue,
      })
    } catch (error) {
      console.error('Error al togglear showPricesToAll:', error)
    }
  }

  // =======================================================
  // NUEVO: FUNCIONES DE CÁLCULO DE SUBTOTALES
  // =======================================================
  const calculateSubtotal = (personItems: { id: string; quantity: number }[]) => {
    let total = 0
    personItems.forEach((item) => {
      const menuItem = menu.find((m) => m.id === item.id)
      if (menuItem) {
        total += menuItem.price * item.quantity
      }
    })
    return total
  }

  const calculateSharedSubtotal = () => {
    let total = 0
    sharedOrderItems.forEach((sharedItem) => {
      const menuItem = menu.find((m) => m.id === sharedItem.itemId)
      if (menuItem) {
        total += menuItem.price * sharedItem.quantity
      }
    })
    return total
  }
  // =======================================================

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded-xl shadow-md relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center text-indigo-700">
        ¡Pedido Grupal Fácil y Divertido! 🎉
      </h1>

      {groupOrderCode && (
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Código de Pedido Compartido:{' '}
            <span className="font-bold text-indigo-600">{groupOrderCode}</span>
          </h3>
          <p className="text-sm text-gray-500">Compártelo con tus amigos.</p>
        </div>
      )}

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
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('shared')}
                className={`${
                  activeTab === 'shared'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300`}
              >
                🍕 Para Compartir
              </button>
              {people.map((person, index) => (
                <div
                  key={person.personIndex}
                  className={`${
                    activeTab === `person-${index}`
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 cursor-pointer`}
                  onClick={() => setActiveTab(`person-${index}`)}
                >
                  {person.name}
                  {!person.locked && !person.finished && user?.uid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleClaimPersonTab(index)
                      }}
                      className="ml-2 px-2 py-1 bg-indigo-200 text-indigo-700 rounded-full text-xs hover:bg-indigo-300 focus:outline-none"
                    >
                      Soy yo
                    </button>
                  )}
                  {person.finished && <span className="ml-2 text-green-500">✅ Terminado</span>}
                  {person.locked && person.userId !== user?.uid && (
                    <span className="ml-2 text-red-500">🔒</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {activeTab === 'shared' && (
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
              // Corrección: ahora sí pasamos la función real
              calculateSharedSubtotal={calculateSharedSubtotal}
              sharedOrderSummaryRef={sharedOrderSummaryRef}
              activeTab={activeTab}
              menu={menu}
              disabled={orderPlaced}
            />
          )}

          {people.map((person, index) =>
            activeTab === `person-${index}` ? (
              <PersonOrder
                key={person.personIndex}
                person={person}
                index={index}
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
                menu={menu}
                onAddItemToPerson={handleAddItemToPerson}
                onPersonOrderItemQuantityChange={handlePersonOrderItemQuantityChange}
                onRemoveItemFromPerson={handleRemoveItemFromPerson}
                // Corrección: la función real
                calculateSubtotal={calculateSubtotal}
                personOrderSummaryRef={personOrderSummaryRef}
                activeTab={activeTab}
                onPersonFinishedOrder={handlePersonFinishedOrder}
                isFinished={person.finished || false}
                personLocked={person.locked || false}
                isCurrentUserTab={person.userId === user?.uid}
                personIndex={index}
                disabled={orderPlaced}
              />
            ) : null,
          )}

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
        <OrderReview
          people={people}
          sharedOrderItems={sharedOrderItems}
          menu={menu}
          onClosePedidoForm={() => setShowPedidoForm(false)}
          // Cambios: pasamos nuestras funciones de cálculo
          calculateSharedSubtotal={calculateSharedSubtotal}
          calculateSubtotal={calculateSubtotal}
          isOrderOwner={isOwner}
          onOrderPlaced={handleOrderPlacement}
          orderPlaced={orderPlaced}
          showPricesToAll={showPricesToAll}
          onToggleShowPrices={handleToggleShowPrices}
        />
      )}

      {feedbackMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {feedbackMessage}
        </div>
      )}

      {/* MODAL para el nombre */}
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
