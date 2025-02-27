/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* src/context/AuthContext.tsx */
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import React, { ReactNode, createContext, useEffect, useState } from 'react'
import { auth, db } from '../utils/firebase'

export interface AuthContextProps {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  userRole: string | null
  points: number
  addPoints: () => Promise<void>
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  userRole: null,
  points: 0,
  addPoints: async () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [points, setPoints] = useState<number>(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)
        try {
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role)
            setPoints(userDoc.data().points || 0)
          } else {
            await setDoc(userDocRef, {
              role: 'client',
              points: 0,
              email: currentUser.email,
            })
            setUserRole('client')
            setPoints(0)
          }
          setUser(currentUser)
        } catch (error) {
          console.error('Error fetching user document:', error)
          setUser(currentUser)
        } finally {
          setLoading(false)
        }
      } else {
        setUser(null)
        setUserRole(null)
        setPoints(0)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role)
        setPoints(userDoc.data().points || 0)
      } else {
        setUserRole('client')
        setPoints(0)
      }
    } catch (error) {
      throw new Error((error as { message: string }).message)
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await setDoc(doc(db, 'users', user.uid), {
        role: 'client',
        points: 0,
        email: email,
      })

      setUserRole('client')
      setPoints(0)
    } catch (error) {
      console.error('Error en el registro:', (error as { message: string }).message)
      throw new Error((error as { message: string }).message)
    }
  }

  const addPoints = async () => {
    if (!user) return // No sumar puntos para usuarios no autenticados

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        points: points + 10,
      })
      setPoints((prevPoints) => prevPoints + 10)
    } catch (error) {
      console.error('Error al sumar puntos', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserRole(null)
      setPoints(0)
    } catch (error) {
      throw new Error((error as { message: string }).message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        userRole,
        points,
        addPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
