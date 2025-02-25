/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* src/pages/MenuPage.tsx */
import { Typography } from '@mui/material'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Person } from '../components/menu/GroupOrderPage'
import JoinOrderModal from '../components/menu/JoinOrderModal'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import TextField from '../components/ui/TextField'
import { MenuItemType } from '../context/AppContext'
import { useAuth } from '../hooks/useAuth'
import { useMenu } from '../hooks/useMenu'
import { COLLECTIONS } from '../utils/constants'
import { db } from '../utils/firebase'

const MenuPage: React.FC = () => {
  const { menu } = useMenu()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [numPeople, setNumPeople] = useState<number>(1)
  const [people, setPeople] = useState<Person[]>(() => {
    return Array.from({ length: 1 }, (_, index) => ({
      personIndex: index,
      userId: null,
      name: `Persona ${index + 1}`,
      items: [],
      locked: false,
      finished: false,
    }))
  })
  const [showMenu, setShowMenu] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isCreatingSharedOrder, setIsCreatingSharedOrder] = useState(false)
  const [isJoiningOrder, setIsJoiningOrder] = useState(false)

  const handleNumPeopleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(event.target.value)
    setNumPeople(num)

    const initialPeople = Array.from({ length: num }, (_, index) => ({
      personIndex: index,
      userId: null,
      name: `Persona ${index + 1}`,
      items: [],
      locked: false,
      finished: false,
    }))
    setPeople(initialPeople)
  }

  const handleNameChange = (index: number, value: string) => {
    const updatedPeople = [...people]
    if (updatedPeople[index]) {
      updatedPeople[index].name = value
      setPeople(updatedPeople)
    }
  }

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleStartOrder = async () => {
    setIsCreatingSharedOrder(true)
    setShowMenu(true)

    const code = generateCode()
    try {
      // Permitir creación de pedido compartido incluso si no hay usuario autenticado
      const groupOrderRef = await addDoc(collection(db, COLLECTIONS.GROUP_ORDERS), {
        code: code,
        ownerId: user ? user.uid : null, // Owner puede ser null para invitados
        status: 'open',
        maxPeople: numPeople,
        createdAt: new Date(),
        participants: people,
        sharedItems: [],
        showPricesToAll: false,
        orderPlaced: false,
        allFinished: false,
      })
      navigate(`/menu/${groupOrderRef.id}?code=${code}`)
    } catch (error) {
      console.error('Error al crear pedido compartido en Firestore:', error)
      setMessage('Error al crear el pedido compartido.')
      setTimeout(() => setMessage(null), 5000)
      setIsCreatingSharedOrder(false)
    }
  }

  const handleJoinOrder = () => {
    setIsJoiningOrder(true)
  }

  const processJoinOrder = async (code: string) => {
    setIsJoiningOrder(false)
    const q = query(
      collection(db, COLLECTIONS.GROUP_ORDERS),
      where('code', '==', code),
      where('status', '==', 'open'),
    )
    try {
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const groupOrderDoc = querySnapshot.docs[0]
        navigate(`/menu/${groupOrderDoc.id}?code=${code}`)
      } else {
        setMessage('No hay pedido activo con este código o el código es incorrecto.')
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error al buscar pedido compartido:', error)
      setMessage('Error al unirse al pedido compartido.')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const formatPriceCOP = (price: number) => {
    return price.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <Container className="my-8">
      <div className="text-center mb-8">
        <Typography variant="h4" component="h1" className="text-3xl font-bold text-gray-900 mb-2">
          ¡Descubre nuestro Menú y Pide Fácil!
        </Typography>
        <Typography className="text-gray-600">
          Crea un pedido compartido con amigos o únete a uno existente.
        </Typography>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsCreatingSharedOrder(true)}
          className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          🎉 Crear Pedido Compartido
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleJoinOrder}
          className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          🤝 Unirme a Pedido Existente
        </Button>
      </div>

      {message && <div className="mb-4 text-center text-red-500">{message}</div>}

      {isCreatingSharedOrder && !showMenu && (
        <div className="max-w-md mx-auto p-6 rounded-xl shadow-lg bg-white animate-slide-down overflow-hidden">
          <Typography variant="h6" className="text-gray-800 mb-4 text-center">
            Configura tu Pedido Compartido
          </Typography>
          <div className="mb-4">
            <label htmlFor="numPeople" className="block text-gray-700 text-sm font-bold mb-2">
              ¿Cuántas personas?
            </label>
            <TextField
              type="number"
              id="numPeople"
              value={numPeople}
              onChange={handleNumPeopleChange}
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {Array.from({ length: numPeople }).map((_, index) => (
            <div key={index} className="mb-4">
              <label
                htmlFor={`personName-${index}`}
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Nombre de la persona {index + 1} (Opcional):
              </label>
              <TextField
                type="text"
                id={`personName-${index}`}
                value={people[index]?.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          ))}
          <div className="mt-6 text-center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartOrder}
              className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              Comenzar a Pedir
            </Button>
          </div>
        </div>
      )}

      <JoinOrderModal
        open={isJoiningOrder}
        onClose={() => setIsJoiningOrder(false)}
        onJoinOrder={processJoinOrder}
      />
    </Container>
  )
}

export default MenuPage
