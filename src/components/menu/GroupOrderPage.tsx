/* src/components/menu/GroupOrderPage.tsx */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MenuItem as MenuItemType } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { useMenu } from '../../hooks/useMenu'
import { COLLECTIONS } from '../../utils/constants'
import { db } from '../../utils/firebase'
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

export interface GroupOrderData {
  code: string
  ownerId: string | null
  status: string
  participants: Person[]
  sharedItems: SharedOrderItem[]
  orderPlaced?: boolean
  allFinished?: boolean
  showPricesToAll?: boolean
}

const GroupOrderPage: FC = (): JSX.Element => {
  const { menu } = useMenu()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [numPeople, setNumPeople] = useState<number>(1)
  const [people, setPeople] = useState<Person[]>([])
  const [showPeopleNames, setShowPeopleNames] = useState<boolean>(false)
  const [showPedidoForm, setShowPedidoForm] = useState<boolean>(false)
  const [sharedOrderItems, setSharedOrderItems] = useState<SharedOrderItem[]>([])
  const [selectedView, setSelectedView] = useState<string>('shared')
  const [groupOrderCode, setGroupOrderCode] = useState<string | null>(null)
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [allFinished, setAllFinished] = useState<boolean>(false)
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false)
  const [showPricesToAll, setShowPricesToAll] = useState<boolean>(false)

  const [editingPersonIndex, setEditingPersonIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState<string>('')

  const [searchParams] = useSearchParams()
  const codeFromURL: string | null = searchParams.get('code')
  const joiningWithCode: boolean = !!codeFromURL
  const { groupOrderId: routeGroupId } = useParams<{ groupOrderId: string }>()

  const sharedOrderSummaryRef = useRef<HTMLDivElement>(null)
  const personRefs = useRef<React.RefObject<HTMLDivElement>[]>([])
  if (personRefs.current.length !== people.length) {
    personRefs.current = Array.from({ length: people.length }, () =>
      React.createRef<HTMLDivElement>(),
    )
  }

  useEffect(() => {
    if (routeGroupId) {
      setGroupOrderId(routeGroupId)
      setGroupOrderCode(codeFromURL)
      const unsubscribe = subscribeToGroupOrder(routeGroupId)
      return () => unsubscribe()
    } else {
      console.error('No se encontró groupOrderId en la ruta')
      navigate('/menu')
    }
  }, [routeGroupId, codeFromURL])

  const subscribeToGroupOrder = (groupId: string): (() => void) => {
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
        setIsOwner(user ? user.uid === data.ownerId : false)
        setAllFinished(data.participants.every((p: Person) => Boolean(p.finished)))
        setOrderPlaced(Boolean(data.orderPlaced))
        setShowPricesToAll(Boolean(data.showPricesToAll))
        if (data.participants.length !== numPeople) {
          setNumPeople(data.participants.length)
        }
        if (data.orderPlaced) {
          setShowPedidoForm(true)
        }
      },
      (error) => {
        console.error('Error al suscribirse al pedido grupal:', error)
        navigate('/menu')
      },
    )
  }

  const handleNumPeopleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const num: number = Number(e.target.value)
    setNumPeople(num)
    setPeople((prev: Person[]) => {
      const currentCount = prev.length
      if (num > currentCount) {
        const newPeople: Person[] = Array.from({ length: num - currentCount }, (_, i) => ({
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

  const handlePersonNameChange = (index: number, name: string): void => {
    setPeople((prev: Person[]) => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index].name = name
      }
      return updated
    })
  }

  const handleStartOrder = (): void => {
    if (people.every((p: Person) => p.name.trim() !== '')) {
      setShowPeopleNames(true)
      setSelectedView('shared')
    } else {
      alert('Por favor ingresa el nombre de cada persona')
    }
  }

  const handleAddToSharedOrder = async (item: MenuItemType): Promise<void> => {
    if (!groupOrderId || orderPlaced) return
    if (item.availabilityStatus !== 'disponible') return

    const existingIndex: number = sharedOrderItems.findIndex((si) => si.itemId === item.id)
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
      console.error('Error al actualizar sharedItems:', (error as Error).message)
    }
  }

  const handleSharedOrderItemQuantityChange = async (
    itemId: string,
    quantity: number,
  ): Promise<void> => {
    if (!groupOrderId || orderPlaced) return
    if (quantity < 0) return

    const updated = sharedOrderItems.map((si) => (si.itemId === itemId ? { ...si, quantity } : si))
    setSharedOrderItems(updated)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        sharedItems: updated,
      })
    } catch (error) {
      console.error('Error al cambiar cantidad en sharedItems:', (error as Error).message)
    }
  }

  const handleRemoveSharedOrderItem = async (itemId: string): Promise<void> => {
    if (!groupOrderId || orderPlaced) return

    const updated = sharedOrderItems.filter((si) => si.itemId !== itemId)
    setSharedOrderItems(updated)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        sharedItems: updated,
      })
    } catch (error) {
      console.error('Error al remover item compartido:', (error as Error).message)
    }
  }

  const handleAddItemToPerson = async (
    personIndex: number,
    menuItem: MenuItemType,
  ): Promise<void> => {
    if (!groupOrderId || orderPlaced) return
    if (menuItem.availabilityStatus !== 'disponible') return

    const personData: Person = people[personIndex]
    const lockedByOther: boolean = user
      ? Boolean(personData.locked) && personData.userId !== user.uid
      : false
    if (lockedByOther) return

    let updatedPeople: Person[] = [...people]
    if (user && !personData.locked) {
      updatedPeople = updatedPeople.map((p, idx) =>
        idx === personIndex ? { ...p, userId: user.uid, locked: true } : p,
      )
    } else if (!user && !personData.locked) {
      // Permitir edición para invitados manteniendo userId como null
      updatedPeople = updatedPeople.map((p, idx) =>
        idx === personIndex ? { ...p, userId: null, locked: true } : p,
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
      console.error('Error al agregar item a persona:', (error as Error).message)
    }
  }

  const handlePersonOrderItemQuantityChange = async (
    personIndex: number,
    itemId: string,
    quantity: number,
  ): Promise<void> => {
    if (!groupOrderId || orderPlaced) return
    if (quantity < 0) return

    const updated = people.map((p, idx) =>
      idx === personIndex
        ? {
            ...p,
            items: p.items.map((it) => (it.id === itemId ? { ...it, quantity } : it)),
          }
        : p,
    )
    setPeople(updated)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
      })
    } catch (error) {
      console.error('Error al cambiar cantidad de item en persona:', (error as Error).message)
    }
  }

  const handleRemoveItemFromPerson = async (personIndex: number, itemId: string): Promise<void> => {
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
      console.error('Error al remover item de persona:', (error as Error).message)
    }
  }

  const handlePersonFinishedOrder = async (personIndex: number): Promise<void> => {
    if (!groupOrderId || orderPlaced) return

    const updated = people.map((p, idx) => (idx === personIndex ? { ...p, finished: true } : p))
    setPeople(updated)
    const everyoneDone: boolean = updated.every((p) => Boolean(p.finished))
    setAllFinished(everyoneDone)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        participants: updated,
        allFinished: everyoneDone,
      })
    } catch (error) {
      console.error('Error al finalizar pedido de persona:', (error as Error).message)
    }
  }

  const handleReviewOrder = (): void => {
    setShowPedidoForm(true)
  }

  const handleOrderPlacement = async (): Promise<void> => {
    if (!groupOrderId) return
    await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
      orderPlaced: true,
    })
    setOrderPlaced(true)
    setShowPedidoForm(true)
  }

  const handleToggleShowPrices = async (): Promise<void> => {
    if (!groupOrderId) return
    const newVal: boolean = !showPricesToAll
    setShowPricesToAll(newVal)
    try {
      await updateDoc(doc(db, COLLECTIONS.GROUP_ORDERS, groupOrderId), {
        showPricesToAll: newVal,
      })
    } catch (error) {
      console.error('Error al alternar visualización de precios:', (error as Error).message)
    }
  }

  const getSharedItemCount = (): number =>
    sharedOrderItems.reduce((acc, si) => acc + si.quantity, 0)

  const getInitialLetter = (name: string): string =>
    name.trim() === '' ? '?' : name.trim()[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-6 text-center">
        {groupOrderCode && (
          <div className="sm:flex sm:items-center sm:justify-center">
            <h2 className="text-2xl font-bold text-indigo-600">
              Código de Pedido: <span className="text-3xl font-mono">{groupOrderCode}</span>
            </h2>
            <p className="text-sm text-gray-500 sm:ml-2">Comparte este código con tus amigos</p>
          </div>
        )}
      </header>

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
              const lockedByOther: boolean =
                Boolean(person.locked) && person.userId !== (user ? user.uid : null)
              const active: boolean = selectedView === `person-${i}`
              const bubbleColors: string[] = [
                'bg-pink-100',
                'bg-blue-100',
                'bg-yellow-100',
                'bg-green-100',
                'bg-purple-100',
                'bg-teal-100',
              ]
              const color: string = bubbleColors[i % bubbleColors.length]
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
                  {editingPersonIndex === i ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        handlePersonNameChange(i, editingName)
                        setEditingPersonIndex(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePersonNameChange(i, editingName)
                          setEditingPersonIndex(null)
                        }
                      }}
                      className="mt-2 text-sm font-medium text-gray-700 max-w-[4rem] truncate border border-gray-300 rounded px-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (!person.locked || (user && person.userId === user.uid) || !user) {
                          setEditingPersonIndex(i)
                          setEditingName(person.name)
                        }
                      }}
                      className="mt-2 text-sm font-medium text-gray-700 max-w-[4rem] truncate cursor-pointer"
                    >
                      {person.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {selectedView === 'shared' ? (
            <SharedOrder
              menuCategories={menu
                .filter((item) => item.availabilityStatus !== 'noDisponibleLargoPlazo')
                .reduce<Record<string, MenuItemType[]>>((acc, item) => {
                  const cat: string = item.recommendation || 'General'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(item)
                  return acc
                }, {})}
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
                const lockedByOther: boolean =
                  Boolean(person.locked) && person.userId !== (user ? user.uid : null)
                return (
                  <PersonOrder
                    key={person.personIndex}
                    person={person}
                    index={i}
                    menuCategories={menu
                      .filter((m) => m.availabilityStatus !== 'noDisponibleLargoPlazo')
                      .reduce<Record<string, MenuItemType[]>>((acc, item) => {
                        const cat: string = item.recommendation || 'General'
                        if (!acc[cat]) acc[cat] = []
                        acc[cat].push(item)
                        return acc
                      }, {})}
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
                    isFinished={Boolean(person.finished)}
                    personLocked={Boolean(person.locked)}
                    isCurrentUserTab={user ? person.userId === user.uid : true}
                    personIndex={i}
                    disabled={lockedByOther || orderPlaced}
                  />
                )
              }
              return null
            })
          )}

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
    </div>
  )
}

export default GroupOrderPage
