/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {
  ArcElement,
  BarElement,
  BubbleDataPoint,
  CategoryScale,
  Chart,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  Point,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'
import { db } from '../utils/firebase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  ArcElement,
)

export interface Pedido {
  orderId: string
  id: string
  status: string
  total: number
  orderDate: Date
  userId: string
}

interface Task {
  id: string
  taskId: string
  taskName: string
  taskType: 'daily' | 'periodic'
  dueDate?: Date | null
  dailyCompletions: { [date: string]: boolean }
  completionDate?: Date | null
  dayOfWeek?: number
  subtasks?: string[]
}

const ALL_STATUSES = ['pendiente', 'atendiendo', 'preparando', 'enviado', 'entregado']

// const defaultDailyTasks = [
//   {
//     taskName: 'Hacer el aseo del restaurante',
//     subtasks: [
//       'Barrer y trapear pisos',
//       'Limpiar mesas y sillas',
//       'Vaciar papeleras',
//       'Limpiar baños',
//     ],
//   },
//   { taskName: 'Lavar la freidora', subtasks: [] },
//   {
//     taskName: 'Revisar inventario y hacer pedidos si es necesario',
//     subtasks: [
//       'Verificar niveles de stock',
//       'Listar productos a pedir',
//       'Enviar pedido a proveedores',
//       'Recibir y organizar pedido',
//     ],
//   },
// ]

// const periodicTasksConfig = [
//   { dayOfMonth: 25, taskName: 'Pagar arriendo', taskType: 'periodic' },
//   { dayOfMonth: 25, taskName: 'Pagar factura de luz', taskType: 'periodic' },
//   { dayOfMonth: 25, taskName: 'Pagar factura de agua', taskType: 'periodic' },
// ]

interface Movement {
  movementId: string
  type: 'entry' | 'exit'
  amount: number
  concept: string
  description?: string
  category: string
  method: string
  createdAt: string
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

const Dashboard: React.FC = () => {
  const { user, userRole, points } = useAuth()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true)

  // Filtro de estado de pedidos
  const [selectedStatus, setSelectedStatus] = useState<string | 'todos'>('todos')

  // Métricas generales
  const [todaySales, setTodaySales] = useState<number>(0)
  const [monthSales, setMonthSales] = useState<number>(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0)
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [, setClientTotalOrders] = useState<number>(0)

  // Datos de contabilidad
  const [cashRegisters, setCashRegisters] = useState<DailyCashRegister[]>([])
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [monthlyBalance, setMonthlyBalance] = useState(0)
  const [categoryData, setCategoryData] = useState<{
    labels: string[]
    income: number[]
    expenses: number[]
  } | null>(null)
  const [monthlyLabelsContabilidad, setMonthlyLabelsContabilidad] = useState<string[]>([])
  const [monthlyIncomeContabilidad, setMonthlyIncomeContabilidad] = useState<number[]>([])
  const [monthlyExpensesContabilidad, setMonthlyExpensesContabilidad] = useState<number[]>([])
  const [contabilityError, setContabilityError] = useState<boolean>(false)

  // Gráficos de ventas
  const [dailyLabels, setDailyLabels] = useState<string[]>([])
  const [dailyData, setDailyData] = useState<number[]>([])
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>([])
  const [monthlyData, setMonthlyData] = useState<number[]>([])
  // const [selectedDateRange, setSelectedDateRange] = useState<{
  //   from: Date | null
  //   to: Date | null
  // }>({ from: null, to: null })

  const chartRef = useRef<Chart<
    'line',
    (number | [number, number] | Point | BubbleDataPoint)[],
    unknown
  > | null>(null)

  const categories = ['venta', 'compra_insumos', 'pago_servicios', 'nomina', 'otros']

  // Escucha la colección de caja para contabilidad
  useEffect(() => {
    setContabilityError(false)
    const qRef = query(collection(db, 'caja'))
    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        const data: DailyCashRegister[] = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data()
          return {
            id: docSnap.id,
            ...docData,
          } as DailyCashRegister
        })
        setCashRegisters(data)
      },
      (error) => {
        console.error('Error fetching contability data:', error)
        setContabilityError(true)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [])

  // UseEffect para calcular métricas de contabilidad
  useEffect(() => {
    if (!cashRegisters || cashRegisters.length === 0) {
      setMonthlyIncome(0)
      setMonthlyExpenses(0)
      setMonthlyBalance(0)
      setCategoryData(null)
      setMonthlyLabelsContabilidad([])
      setMonthlyExpensesContabilidad([])
      setMonthlyIncomeContabilidad([])
      return
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const filteredRegisters = cashRegisters.filter((reg) => {
      const date = new Date(reg.date)
      return date >= firstDayOfMonth && date <= now
    })

    let totalIncome = 0
    let totalExpenses = 0
    // Inicializa categoryTotals con las categorías predefinidas
    const categoryTotals = categories.reduce(
      (acc, category) => {
        acc[category] = { income: 0, expenses: 0 }
        return acc
      },
      {} as Record<string, { income: number; expenses: number }>,
    )

    console.log('cashRegisters data inside categoryData useEffect:', cashRegisters)

    filteredRegisters.forEach((register) => {
      register.movements.forEach((mov) => {
        if (mov.type === 'entry') {
          totalIncome += mov.amount
          // Si la categoría no existe en categoryTotals, la inicializamos
          if (!categoryTotals[mov.category]) {
            categoryTotals[mov.category] = { income: 0, expenses: 0 }
          }
          categoryTotals[mov.category].income += mov.amount
        } else {
          totalExpenses += mov.amount
          if (!categoryTotals[mov.category]) {
            categoryTotals[mov.category] = { income: 0, expenses: 0 }
          }
          categoryTotals[mov.category].expenses += mov.amount
        }
      })
    })

    console.log('categoryTotals after processing movements:', categoryTotals)

    setMonthlyIncome(totalIncome)
    setMonthlyExpenses(totalExpenses)
    setMonthlyBalance(totalIncome - totalExpenses)

    // En lugar de iterar sobre las categorías predefinidas, usamos las claves de categoryTotals
    const labels: string[] = []
    const income: number[] = []
    const expenses: number[] = []

    Object.keys(categoryTotals).forEach((category) => {
      if (categoryTotals[category].income > 0 || categoryTotals[category].expenses > 0) {
        labels.push(category)
        income.push(categoryTotals[category].income)
        expenses.push(categoryTotals[category].expenses)
      }
    })

    const finalCategoryData = { labels, income, expenses }
    console.log('Final categoryData before setState:', finalCategoryData)
    setCategoryData(finalCategoryData)
  }, [cashRegisters])

  useEffect(() => {
    let pedidosQuery = collection(db, 'pedidos')
    if (userRole === 'client' && user) {
      pedidosQuery = query(pedidosQuery, where('userId', '==', user.uid)) as never
    }

    const unsubscribe = onSnapshot(
      pedidosQuery,
      (snapshot) => {
        const pedidosData: Pedido[] = snapshot.docs.map((doc) => {
          const data = doc.data() as {
            status: string
            total: number
            orderDate: { toDate: () => Date; toMillis: () => number }
            userId: string
          }
          return {
            id: doc.id,
            status: data.status,
            total: data.total,
            orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : new Date(),
            userId: data.userId,
          } as Pedido
        })
        setPedidos(pedidosData)
        setLoading(false)
      },
      (error) => {
        console.error('Error en el listener de pedidos:', error)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [user, userRole])

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'encargado') {
      const today = new Date()
      const todayDateString = today.toISOString().split('T')[0]

      const tasksCollection = collection(db, 'tasks')
      const unsubscribeTasks = onSnapshot(
        tasksCollection,
        (snapshot) => {
          let fetchedTasks: Task[] = snapshot.docs.map((doc) => {
            const data = doc.data() as {
              taskId: string
              taskName: string
              taskType: 'daily' | 'periodic'
              dueDate: { toDate: () => Date } | null
              dailyCompletions: { [date: string]: boolean }
              completionDate: { toDate: () => Date } | null
              subtasks: string[]
            }
            return {
              id: doc.id,
              taskId: data.taskId,
              taskName: data.taskName,
              taskType: data.taskType,
              dueDate: data.dueDate ? data.dueDate.toDate() : null,
              dailyCompletions: data.dailyCompletions || {},
              completionDate: data.completionDate ? data.completionDate.toDate() : null,
              subtasks: data.subtasks || [],
            } as Task
          })

          fetchedTasks = fetchedTasks.filter((task) => {
            if (task.taskType === 'daily') {
              return true
            } else if (task.taskType === 'periodic' && task.dueDate) {
              const taskDueDate = task.dueDate
              return taskDueDate.toISOString().split('T')[0] === todayDateString
            }
            return false
          })
          setTasks(fetchedTasks)
          setLoadingTasks(false)
        },
        (error) => {
          console.error('Error en el listener de tareas:', error)
          setLoadingTasks(false)
        },
      )
      return () => unsubscribeTasks()
    } else {
      setLoadingTasks(false)
    }
  }, [userRole])

  // const addDefaultTask = async (
  //   taskName: string,
  //   taskType: 'daily' | 'periodic',
  //   subtasks: string[] = [],
  //   dueDate: Date | null = null,
  // ) => {
  //   try {
  //     await setDoc(doc(collection(db, 'tasks'), uuidv4()), {
  //       taskId: uuidv4(),
  //       taskName: taskName,
  //       taskType: taskType,
  //       completed: false,
  //       dailyCompletions: {},
  //       subtasks: subtasks,
  //       dueDate: dueDate || null,
  //     })
  //   } catch (error) {
  //     console.error('Error adding default task:', error)
  //   }
  // }

  useEffect(() => {
    if (!pedidos.length) {
      setTodaySales(0)
      setMonthSales(0)
      setPendingOrdersCount(0)
      setTotalOrders(0)
      setDailyLabels([])
      setDailyData([])
      setMonthlyLabels([])
      setMonthlyData([])
      setClientTotalOrders(0)
      return
    }

    const filtered =
      selectedStatus === 'todos' ? pedidos : pedidos.filter((p) => p.status === selectedStatus)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    let sumToday = 0
    let sumMonth = 0
    let pendingCount = 0
    const totalCount = filtered.length
    let clientOrderCount = 0

    filtered.forEach((pedido) => {
      const pedidoDate = new Date(
        pedido.orderDate.getFullYear(),
        pedido.orderDate.getMonth(),
        pedido.orderDate.getDate(),
      ).getTime()

      if (pedidoDate === today) {
        sumToday += pedido.total
      }

      const isThisMonth =
        pedido.orderDate.getMonth() === now.getMonth() &&
        pedido.orderDate.getFullYear() === now.getFullYear()
      if (isThisMonth) {
        sumMonth += pedido.total
      }

      if (pedido.status === 'pendiente') {
        pendingCount++
      }

      if (userRole === 'client' && user && pedido.userId === user.uid) {
        clientOrderCount++
      }
    })

    setTodaySales(sumToday)
    setMonthSales(sumMonth)
    setPendingOrdersCount(pendingCount)
    setTotalOrders(totalCount)
    setClientTotalOrders(clientOrderCount)

    const last7Dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d
    })

    const daysLabels: string[] = []
    const daysData: number[] = []

    last7Dates.forEach((date) => {
      const dayKey = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      })
      daysLabels.push(dayKey)

      let dayTotal = 0
      filtered.forEach((pedido) => {
        if (
          pedido.orderDate.getDate() === date.getDate() &&
          pedido.orderDate.getMonth() === date.getMonth() &&
          pedido.orderDate.getFullYear() === date.getFullYear()
        ) {
          dayTotal += pedido.total
        }
      })
      daysData.push(dayTotal)
    })

    setDailyLabels(daysLabels)
    setDailyData(daysData)

    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      d.setDate(1)
      return d
    })

    const monthLabels: string[] = []
    const monthTotals: number[] = []

    last6Months.forEach((date) => {
      const label = date.toLocaleDateString('es-ES', { month: '2-digit', year: '2-digit' })
      monthLabels.push(label)

      let monthTotal = 0
      filtered.forEach((pedido) => {
        if (
          pedido.orderDate.getFullYear() === date.getFullYear() &&
          pedido.orderDate.getMonth() === date.getMonth()
        ) {
          monthTotal += pedido.total
        }
      })
      monthTotals.push(monthTotal)
    })

    setMonthlyLabels(monthLabels)
    setMonthlyData(monthTotals)
  }, [pedidos, selectedStatus, userRole, user])

  const categoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (tooltipItem: import('chart.js').TooltipItem<'pie'>) => {
            let label = tooltipItem.label || ''
            if (label) {
              label += ': '
            }
            if (tooltipItem.parsed !== null) {
              label += new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(tooltipItem.parsed)
            }
            return label
          },
        },
      },
    },
  }

  const monthlyContabilidadChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
  }

  const dailyChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Ventas diarias',
        data: dailyData,
        backgroundColor: '#4F46E5',
        borderRadius: 4,
      },
    ],
  }

  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Ventas mensuales',
        data: monthlyData,
        backgroundColor: '#22C55E',
        borderRadius: 4,
      },
    ],
  }

  const monthlyContabilidadChartData = {
    labels: monthlyLabelsContabilidad,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyIncomeContabilidad,
        borderColor: '#43D478',
        backgroundColor: '#43D478',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Egresos',
        data: monthlyExpensesContabilidad,
        borderColor: '#E53935',
        backgroundColor: '#E53935',
        fill: false,
        tension: 0.3,
      },
    ],
  }

  const categoryChartData =
    categoryData &&
    categoryData.labels &&
    categoryData.labels.length > 0 &&
    categoryData.income &&
    categoryData.expenses
      ? {
          labels: categoryData.labels,
          datasets: [
            {
              label: 'Ingresos',
              data: categoryData.income.map((val) => val || 0),
              backgroundColor: ['#00A86B', '#43D478', '#95E1D3', '#F7B731', '#F73D47', '#78103C'],
              hoverOffset: 4,
            },
            {
              label: 'Egresos',
              data: categoryData.expenses.map((val) => val || 0),
              backgroundColor: ['#E53935', '#870D17', '#F06292', '#A7004B', '#004772', '#0087D0'],
              hoverOffset: 4,
            },
          ],
        }
      : null

  const showAdminStats = userRole === 'admin' || userRole === 'encargado'
  const showChecklist = userRole === 'admin' || userRole === 'encargado'
  const showClientStats = userRole === 'client'

  const handleTaskCompletionChange = async (taskId: string, completed: boolean) => {
    const todayDate = new Date().toISOString().split('T')[0]
    try {
      const taskDocRef = doc(db, 'tasks', taskId)
      await updateDoc(taskDocRef, {
        [`dailyCompletions.${todayDate}`]: completed,
        completionDate: completed ? new Date() : null,
      })

      setTasks((currentTasks) =>
        currentTasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              dailyCompletions: {
                ...task.dailyCompletions,
                [todayDate]: completed,
              },
              completionDate: completed ? new Date() : null,
            }
          }
          return task
        }),
      )
    } catch (error) {
      console.error('Error updating task completion:', error)
    }
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - i)
    return day
  }).reverse()

  const last7DaysFormatted = last7Days.map((day) => day.toISOString().split('T')[0])

  const formatPriceCOP = (price: number) => {
    return price.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  if (loading || loadingTasks) {
    return (
      <div className="pt-20 p-4 text-center">
        <p className="text-xl animate-pulse">Cargando Dashboard...</p>
      </div>
    )
  }

  if (showClientStats) {
    return (
      <div className="pt-20 p-4 md:p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 transition-all duration-300 hover:scale-105">
          Bienvenido a SrPol! <span className="text-sm ml-2">({user?.email})</span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-700 font-semibold text-lg mb-2">Descubre nuestro Menú</p>
            <p className="text-gray-600">Explora deliciosos platos y arma tu pedido.</p>
            <p className="text-2xl font-bold text-indigo-600 mt-4">¡Haz tu pedido ahora!</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-700 font-semibold text-lg mb-2">Acumula Puntos</p>
            <p className="text-gray-600">Cada pedido te da puntos para descuentos.</p>
            <p className="text-2xl font-bold text-green-600 mt-4">Tienes {points} puntos.</p>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4 mb-6 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">¿Listo para ordenar?</h2>
          <p className="text-gray-600 mb-4">
            Navega por nuestro menú, personaliza tu pedido y disfruta de la mejor comida.
          </p>
          <p className="text-lg text-indigo-700 font-semibold">
            ¡Empieza a explorar nuestro menú hoy mismo!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 p-4 md:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 transition-all duration-300 hover:scale-105">
        Dashboard {user?.email && <span className="text-sm ml-2">({user.email})</span>}
      </h1>

      {showAdminStats && (
        <div className="flex flex-wrap items-center mb-6 gap-2">
          <button
            onClick={() => setSelectedStatus('todos')}
            className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition transform hover:scale-105
              ${
                selectedStatus === 'todos'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-200'
              }`}
          >
            Todos
          </button>
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition transform hover:scale-105
                  ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-200'
                  }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      )}

      {showAdminStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-indigo-600">{totalOrders}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Ventas Hoy</p>
            <p className="text-2xl font-bold text-indigo-600">{formatPriceCOP(todaySales)}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Ventas del Mes</p>
            <p className="text-2xl font-bold text-indigo-600">{formatPriceCOP(monthSales)}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Pedidos Pendientes</p>
            <p className="text-2xl font-bold text-indigo-600">{pendingOrdersCount}</p>
          </div>
        </div>
      )}

      {showAdminStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Resumen de Contabilidad Mensual
            </h2>
            <p className="text-gray-700">
              <strong>Ingresos Totales:</strong> {formatPriceCOP(monthlyIncome)}
            </p>
            <p className="text-gray-700">
              <strong>Egresos Totales:</strong> {formatPriceCOP(monthlyExpenses)}
            </p>
            <p className="text-gray-700 font-semibold">
              <strong>Balance Neto:</strong> {formatPriceCOP(monthlyBalance)}
            </p>
            <div className="h-64">
              {monthlyBalance > 0 ? (
                <Bar
                  data={{
                    labels: ['Balance Neto'],
                    datasets: [
                      { label: 'Balance Neto', data: [monthlyBalance], backgroundColor: '#22C55E' },
                    ],
                  }}
                  options={chartOptions}
                />
              ) : (
                <Bar
                  data={{
                    labels: ['Balance Neto'],
                    datasets: [
                      { label: 'Balance Neto', data: [monthlyBalance], backgroundColor: '#E53935' },
                    ],
                  }}
                  options={chartOptions}
                />
              )}
            </div>
          </div>
          {showAdminStats &&
          categoryData &&
          categoryData.labels?.length &&
          Array.isArray(categoryData.income) &&
          Array.isArray(categoryData.expenses) ? (
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Análisis por Categoría</h2>
              <div className="h-64 relative">
                {categoryChartData &&
                categoryChartData.labels &&
                Array.isArray(categoryChartData.labels) &&
                categoryChartData.datasets &&
                Array.isArray(categoryChartData.datasets) ? (
                  <Pie data={categoryChartData} options={categoryChartOptions} />
                ) : (
                  <p className="text-gray-500 italic text-center">
                    Error al preparar datos para el gráfico de categorías.
                  </p>
                )}
              </div>
            </div>
          ) : null}
          {contabilityError && (
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-red-500 font-semibold">Error al cargar datos de contabilidad.</p>
              <p className="text-gray-600 text-sm">
                Por favor, intenta recargar la página o contacta al administrador.
              </p>
            </div>
          )}
        </div>
      )}

      {showAdminStats && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Comparativa de Ingresos y Egresos Mensuales
          </h2>
          <div className="h-64">
            <Line
              data={monthlyContabilidadChartData}
              options={monthlyContabilidadChartOptions}
              ref={chartRef}
            />
          </div>
        </div>
      )}

      {showAdminStats && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ventas diarias (últimos 7 días)
          </h2>
          <div className="h-64">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {showAdminStats && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ventas mensuales (últimos 6 meses)
          </h2>
          <div className="h-64">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {showChecklist && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Checklist Diario de Tareas (Hoy)
          </h2>
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="py-2 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      checked={
                        task.dailyCompletions[new Date().toISOString().split('T')[0]] === true
                      }
                      onChange={(e) => {
                        const x = handleTaskCompletionChange(task.id, e.target.checked)
                        console.log(x)
                      }}
                    />
                    <span className="ml-2 text-gray-700">{task.taskName}</span>
                  </label>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <ul className="ml-6 mt-1">
                    {task.subtasks.map((subtask, index) => (
                      <li key={index} className="text-sm text-gray-500 list-disc ml-4">
                        {subtask}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showChecklist && (
        <div className="bg-white rounded shadow p-4 mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Estado de Tareas Semanal</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">Tarea</th>
                  {last7Days.map((day) => (
                    <th
                      key={day.toISOString().split('T')[0]}
                      className="border border-gray-200 px-4 py-2 text-center"
                    >
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.taskId}>
                    <td className="border border-gray-200 px-4 py-2">{task.taskName}</td>
                    {last7DaysFormatted.map((date) => (
                      <td
                        key={`${task.taskId}-${date}`}
                        className="border border-gray-200 px-4 py-2 text-center"
                      >
                        {task.dailyCompletions[date] ? '✅' : '❌'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
