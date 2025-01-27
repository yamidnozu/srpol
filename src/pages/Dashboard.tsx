/* src/pages/Dashboard.tsx */
/* src/pages/Dashboard.tsx */
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc, // Import updateDoc here
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { v4 as uuidv4 } from "uuid"; // Import UUID
import { useAuth } from "../hooks/useAuth";
import { db } from "../utils/firebase";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/** Interfaz para pedido */
interface Pedido {
  id: string;
  status: string;
  total: number;
  orderDate: Date;
}

interface Task {
  id: string;
  taskId: string;
  taskName: string;
  taskType: "daily" | "periodic";
  dueDate?: Date | null;
  dailyCompletions: { [date: string]: boolean }; // Track completion per day
  completionDate?: Date | null;
  dayOfWeek?: number;
  subtasks?: string[];
}

// Estados que manejaremos en la app
const ALL_STATUSES = [
  "pendiente",
  "atendiendo",
  "preparando",
  "enviado",
  "entregado",
];

const defaultDailyTasks = [
  {
    taskName: "Hacer el aseo del restaurante",
    subtasks: [
      "Barrer y trapear pisos",
      "Limpiar mesas y sillas",
      "Vaciar papeleras",
      "Limpiar baños",
    ],
  },
  { taskName: "Lavar la freidora", subtasks: [] },
  {
    taskName: "Revisar inventario y hacer pedidos si es necesario",
    subtasks: [
      "Verificar niveles de stock",
      "Listar productos a pedir",
      "Enviar pedido a proveedores",
      "Recibir y organizar pedido",
    ],
  },
];

const periodicTasksConfig = [
  { dayOfMonth: 25, taskName: "Pagar arriendo", taskType: "periodic" },
  { dayOfMonth: 25, taskName: "Pagar factura de luz", taskType: "periodic" },
  { dayOfMonth: 25, taskName: "Pagar factura de agua", taskType: "periodic" },
  // Add more periodic tasks as needed
];

const Dashboard: React.FC = () => {
  const { user, userRole } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);

  // Para filtrar por un estado específico o "todos"
  const [selectedStatus, setSelectedStatus] = useState<string | "todos">(
    "todos"
  );

  // Métricas generales
  const [todaySales, setTodaySales] = useState<number>(0);
  const [monthSales, setMonthSales] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // Gráficos (últimos 7 días + últimos 6 meses)
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [dailyData, setDailyData] = useState<number[]>([]);
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>([]);
  const [monthlyData, setMonthlyData] = useState<number[]>([]);

  useEffect(() => {
    // Escuchamos la colección 'pedidos'
    const unsubscribe = onSnapshot(collection(db, "pedidos"), (snapshot) => {
      const pedidosData: Pedido[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status,
          total: data.total,
          orderDate: data.orderDate?.toDate
            ? data.orderDate.toDate()
            : new Date(), // fallback
        } as Pedido;
      });
      setPedidos(pedidosData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const today = new Date();
    const todayDateString = today.toISOString().split("T")[0];

    const tasksCollection = collection(db, "tasks");
    const unsubscribeTasks = onSnapshot(tasksCollection, (snapshot) => {
      let fetchedTasks: Task[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          taskId: data.taskId,
          taskName: data.taskName,
          taskType: data.taskType,
          dueDate: data.dueDate ? data.dueDate.toDate() : null,
          dailyCompletions: data.dailyCompletions || {}, // Initialize dailyCompletions
          completionDate: data.completionDate
            ? data.completionDate.toDate()
            : null,
          subtasks: data.subtasks || [],
        } as Task;
      });

      // Filter for today's daily tasks and periodic tasks due today
      fetchedTasks = fetchedTasks.filter((task) => {
        if (task.taskType === "daily") {
          return true; // Show all daily tasks
        } else if (task.taskType === "periodic" && task.dueDate) {
          const taskDueDate = task.dueDate;
          return taskDueDate.toISOString().split("T")[0] === todayDateString;
        }
        return false;
      });
      setTasks(fetchedTasks);
      setLoadingTasks(false);

      if (fetchedTasks.length === 0) {
        // Initialize daily tasks if none exist for today
        defaultDailyTasks.forEach(async (defaultTask) => {
          await addDefaultTask(
            defaultTask.taskName,
            "daily",
            defaultTask.subtasks
          );
        });
        // Initialize periodic tasks if today is the day for them and they don't exist
        periodicTasksConfig.forEach(async (periodicTaskConfig) => {
          if (today.getDate() === periodicTaskConfig.dayOfMonth) {
            const taskExists = fetchedTasks.some(
              (task) =>
                task.taskType === "periodic" &&
                task.taskName === periodicTaskConfig.taskName &&
                task.dueDate &&
                task.dueDate.getDate() === today.getDate() &&
                task.dueDate.getMonth() === today.getMonth() &&
                task.dueDate.getFullYear() === today.getFullYear()
            );
            if (!taskExists) {
              const dueDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                periodicTaskConfig.dayOfMonth
              );
              await addDefaultTask(
                periodicTaskConfig.taskName,
                "periodic",
                [],
                dueDate
              );
            }
          }
        });
      }
    });
    return () => unsubscribeTasks();
  }, []);

  const addDefaultTask = async (
    taskName: string,
    taskType: "daily" | "periodic",
    subtasks: string[] = [],
    dueDate: Date | null = null
  ) => {
    try {
      await setDoc(doc(collection(db, "tasks"), uuidv4()), {
        // use uuid as doc id
        taskId: uuidv4(), // add taskId
        taskName: taskName,
        taskType: taskType,
        completed: false,
        dailyCompletions: {}, // Initialize dailyCompletions to empty object
        subtasks: subtasks,
        dueDate: dueDate || null,
      });
    } catch (error) {
      console.error("Error adding default task:", error);
    }
  };

  // Recalcula estadísticas cuando cambien los pedidos o el filtro de estado
  useEffect(() => {
    if (!pedidos.length) {
      // Si no hay pedidos, limpiamos
      setTodaySales(0);
      setMonthSales(0);
      setPendingOrdersCount(0);
      setTotalOrders(0);
      setDailyLabels([]);
      setDailyData([]);
      setMonthlyLabels([]);
      setMonthlyData([]);
      return;
    }

    const filtered =
      selectedStatus === "todos"
        ? pedidos
        : pedidos.filter((p) => p.status === selectedStatus);

    // ---------- Estadísticas simples ----------
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    let sumToday = 0;
    let sumMonth = 0;
    let pendingCount = 0;
    const totalCount = filtered.length;

    filtered.forEach((pedido) => {
      // Fecha sin hora del pedido
      const pedidoDate = new Date(
        pedido.orderDate.getFullYear(),
        pedido.orderDate.getMonth(),
        pedido.orderDate.getDate()
      ).getTime();

      // Venta de hoy
      if (pedidoDate === today) {
        sumToday += pedido.total;
      }

      // Venta del mes actual
      const isThisMonth =
        pedido.orderDate.getMonth() === now.getMonth() &&
        pedido.orderDate.getFullYear() === now.getFullYear();
      if (isThisMonth) {
        sumMonth += pedido.total;
      }

      // Pedidos pendientes
      if (pedido.status === "pendiente") {
        pendingCount++;
      }
    });

    setTodaySales(sumToday);
    setMonthSales(sumMonth);
    setPendingOrdersCount(pendingCount);
    setTotalOrders(totalCount);

    // ---------- Gráfico: últimos 7 días ----------
    const last7Dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      // "hace (6 - i) días" para que se armen en orden cronológico
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const daysLabels: string[] = [];
    const daysData: number[] = [];

    last7Dates.forEach((date) => {
      // Etiqueta: "dd/MM"
      const dayKey = date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
      daysLabels.push(dayKey);

      let dayTotal = 0;
      filtered.forEach((pedido) => {
        if (
          pedido.orderDate.getDate() === date.getDate() &&
          pedido.orderDate.getMonth() === date.getMonth() &&
          pedido.orderDate.getFullYear() === date.getFullYear()
        ) {
          dayTotal += pedido.total;
        }
      });
      daysData.push(dayTotal);
    });

    setDailyLabels(daysLabels);
    setDailyData(daysData);

    // ---------- Gráfico: últimos 6 meses ----------
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      // retrocedemos (5 - i) meses
      d.setMonth(d.getMonth() - (5 - i));
      d.setDate(1);
      return d;
    });

    const monthLabels: string[] = [];
    const monthTotals: number[] = [];

    last6Months.forEach((date) => {
      // Etiqueta "MM/YY"
      const label = date.toLocaleDateString("es-ES", {
        month: "2-digit",
        year: "2-digit",
      });
      monthLabels.push(label);

      let monthTotal = 0;
      filtered.forEach((pedido) => {
        if (
          pedido.orderDate.getFullYear() === date.getFullYear() &&
          pedido.orderDate.getMonth() === date.getMonth()
        ) {
          monthTotal += pedido.total;
        }
      });
      monthTotals.push(monthTotal);
    });

    setMonthlyLabels(monthLabels);
    setMonthlyData(monthTotals);
  }, [pedidos, selectedStatus]);

  // Opciones genéricas para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false as const,
      },
      tooltip: {
        backgroundColor: "#1e293b", // gris oscuro
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
  };

  // Dataset para gráfico diario
  const dailyChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: "Ventas diarias",
        data: dailyData,
        backgroundColor: "#4F46E5", // Indigo-600
        borderRadius: 4,
      },
    ],
  };

  // Dataset para gráfico mensual
  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Ventas mensuales",
        data: monthlyData,
        backgroundColor: "#22C55E", // Green-500
        borderRadius: 4,
      },
    ],
  };

  // Para saber si debemos mostrar la parte de admin/encargado
  const showAdminStats = userRole === "admin" || userRole === "encargado";
  const showChecklist = userRole === "admin" || userRole === "encargado";

  const handleTaskCompletionChange = async (
    taskId: string,
    completed: boolean
  ) => {
    const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    try {
      const taskDocRef = doc(db, "tasks", taskId);
      await updateDoc(taskDocRef, {
        [`dailyCompletions.${todayDate}`]: completed, // Update completion for today
        completionDate: completed ? new Date() : null, // Optionally update completionDate
      });

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
            };
          }
          return task;
        })
      );
    } catch (error) {
      console.error("Error updating task completion:", error);
    }
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - i);
    return day;
  }).reverse();

  const last7DaysFormatted = last7Days.map(
    (day) => day.toISOString().split("T")[0]
  );

  const taskCompletionData = tasks.map((task) => {
    return {
      taskName: task.taskName,
      completionStatus: last7DaysFormatted.map((date) => {
        return task.dailyCompletions[date] ? "✅" : "❌";
      }),
    };
  });

  if (loading || loadingTasks) {
    return (
      <div className="pt-20 p-4 text-center">
        <p className="text-xl animate-pulse">Cargando Dashboard...</p>
      </div>
    );
  }

  if (!showAdminStats && !showChecklist) {
    return (
      <div className="pt-20 p-4 md:p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 transition-all duration-300 hover:scale-105">
          Dashboard <span className="text-sm ml-2">({user?.email})</span>
        </h1>
        <div className="mb-8">
          <div className="bg-white rounded shadow p-4 text-center">
            <p className="text-gray-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-indigo-600">{totalOrders}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 p-4 md:p-6 bg-gray-100 min-h-screen">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4 transition-all duration-300 hover:scale-105">
        Dashboard
        {user?.email && <span className="text-sm ml-2">({user.email})</span>}
      </h1>

      {/* Filtro por estado */}
      <div className="flex flex-wrap items-center mb-6 gap-2">
        <button
          onClick={() => setSelectedStatus("todos")}
          className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition transform hover:scale-105
            ${
              selectedStatus === "todos"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-200"
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
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-200"
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Sección de Tarjetas de estadísticas */}
      {showAdminStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-indigo-600">{totalOrders}</p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Ventas Hoy</p>
            <p className="text-2xl font-bold text-indigo-600">
              ${todaySales.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Ventas del Mes</p>
            <p className="text-2xl font-bold text-indigo-600">
              ${monthSales.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded shadow p-4 text-center transition transform hover:scale-105">
            <p className="text-gray-600">Pedidos Pendientes</p>
            <p className="text-2xl font-bold text-indigo-600">
              {pendingOrdersCount}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de Ventas Diarias (últimos 7 días) */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Ventas diarias (últimos 7 días)
        </h2>
        <div className="h-64">
          <Bar data={dailyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Gráfico de Ventas Mensuales (últimos 6 meses) */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Ventas mensuales (últimos 6 meses)
        </h2>
        <div className="h-64">
          <Bar data={monthlyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Daily Checklist Section */}
      {showChecklist && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Checklist Diario de Tareas (Hoy)
          </h2>
          <ul>
            {tasks.map((task) => (
              <li
                key={task.id}
                className="py-2 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      checked={
                        task.dailyCompletions[
                          new Date().toISOString().split("T")[0]
                        ] === true
                      } // Check against today's completion status
                      onChange={(e) =>
                        handleTaskCompletionChange(task.id, e.target.checked)
                      }
                    />
                    <span className="ml-2 text-gray-700">{task.taskName}</span>
                  </label>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <ul className="ml-6 mt-1">
                    {task.subtasks.map((subtask, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-500 list-disc ml-4"
                      >
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Estado de Tareas Semanal
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse border border-gray-200">
              <thead>
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">
                    Tarea
                  </th>
                  {last7Days.map((day) => (
                    <th
                      key={day.toISOString().split("T")[0]}
                      className="border border-gray-200 px-4 py-2 text-center"
                    >
                      {day.toLocaleDateString("es-ES", { weekday: "short" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.taskId}>
                    <td className="border border-gray-200 px-4 py-2">
                      {task.taskName}
                    </td>
                    {last7DaysFormatted.map((date, index) => (
                      <td
                        key={`${task.taskId}-${date}`}
                        className="border border-gray-200 px-4 py-2 text-center"
                      >
                        {task.dailyCompletions[date] ? "✅" : "❌"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aquí podrías agregar más secciones o gráficos */}
    </div>
  );
};

export default Dashboard;