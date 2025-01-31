// src/pages/ContabilidadPage.tsx
import { addDoc, collection, onSnapshot, query } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { db } from '../utils/firebase'

interface Movement {
  movementId: string
  type: 'entry' | 'exit'
  amount: number
  concept: string
  createdAt: any
  createdBy: string
}

interface DailyCashRegister {
  id: string
  date: string
  openingAmount: number
  closingAmount?: number
  realClosingAmount?: number
  discrepancy?: number
  status: 'open' | 'closed'
  createdBy: string
  closedBy?: string
  movements: Movement[]
}

const ContabilidadPage: React.FC = () => {
  const { user, userRole } = useAuth()
  const [cashRegisters, setCashRegisters] = useState<DailyCashRegister[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const qRef = query(collection(db, 'caja'))
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      const data: DailyCashRegister[] = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data()
        return {
          id: docSnap.id,
          ...docData,
        } as DailyCashRegister
      })
      setCashRegisters(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleOpenDay = async () => {
    if (!user) return
    // Ver si ya hay un registro "open"
    const alreadyOpen = cashRegisters.find((reg) => reg.status === 'open')
    if (alreadyOpen) {
      alert('Ya hay un día abierto, ciérralo primero antes de abrir otro.')
      return
    }
    // Pedir monto de apertura
    const opening = Number(prompt('Monto de apertura en efectivo:') || 0)
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0] // "YYYY-MM-DD"

    try {
      await addDoc(collection(db, 'caja'), {
        date: dateStr,
        openingAmount: opening,
        status: 'open',
        createdBy: user.uid,
        movements: [],
      })
      alert('Día abierto exitosamente.')
    } catch (error) {
      console.error('Error abriendo el día:', error)
      alert('Ocurrió un error al abrir el día')
    }
  }

  const goToDetail = (id: string) => {
    window.location.href = `/contabilidad/${id}`
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4">Cargando datos de contabilidad...</div>
      </MainLayout>
    )
  }

  // Function to format price to Colombian Pesos
  const formatPriceCOP = (price: number) => {
    return price.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  return (
    <MainLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2 text-center text-indigo-700">Contabilidad / Caja</h1>
        <p className="mb-4 text-gray-600 text-center">
          Aquí podrás abrir un nuevo día, registrar movimientos y cerrar la caja diaria.
        </p>

        {(userRole === 'admin' || userRole === 'encargado') && (
          <div className="text-center mb-4">
            <button
              onClick={handleOpenDay}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Abrir Nuevo Día
            </button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {cashRegisters.map((reg) => (
            <div
              key={reg.id}
              className="border p-4 rounded flex justify-between items-center shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100"
            >
              <div>
                <p>
                  <strong>Fecha:</strong> {reg.date}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={reg.status === 'open' ? 'text-green-600' : 'text-gray-600'}>
                    {reg.status.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Apertura:</strong> {formatPriceCOP(reg.openingAmount)}
                </p>
                {reg.status === 'closed' && (
                  <>
                    <p>
                      <strong>Declarado al Cerrar:</strong> {formatPriceCOP(reg.closingAmount || 0)}
                    </p>
                    <p>
                      <strong>Efectivo Contado:</strong>{' '}
                      {reg.realClosingAmount !== undefined
                        ? formatPriceCOP(reg.realClosingAmount)
                        : '—'}
                    </p>
                    {reg.discrepancy !== undefined && (
                      <p
                        className={
                          reg.discrepancy === 0
                            ? 'text-green-700 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        Discrepancia: {formatPriceCOP(reg.discrepancy || 0)}
                      </p>
                    )}
                  </>
                )}
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
                onClick={() => goToDetail(reg.id)}
              >
                Ver Detalle
              </button>
            </div>
          ))}
        </div>

        {cashRegisters.length === 0 && (
          <p className="mt-6 text-gray-500 text-center">No hay registros de caja todavía.</p>
        )}
      </div>
    </MainLayout>
  )
}

export default ContabilidadPage
