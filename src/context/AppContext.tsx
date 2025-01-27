/* Inicio src\context\AppContext.tsx */
import { CircularProgress } from "@mui/material";
import { collection, onSnapshot } from "firebase/firestore";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import ErrorBoundary from "../components/ui/ErrorBoundry";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  recommendation: string;
  observations: string;
  availabilityStatus:
    | "disponible"
    | "noDisponibleMomento"
    | "noDisponibleLargoPlazo"; // Estado de disponibilidad del menú: "disponible", "noDisponibleMomento", "noDisponibleLargoPlazo"
}

export interface AppContextProps {
  menu: MenuItem[];
  loading: boolean;
}

export const AppContext = createContext<AppContextProps>({
  menu: [],
  loading: true,
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsubscribe: () => void;
    try {
      const menuCollection = collection(db, COLLECTIONS.MENU);
      unsubscribe = onSnapshot(menuCollection, (snapshot) => {
        const menuData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
        );
        setMenu(menuData);
        setLoading(false);
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ menu, loading }}>
      <ErrorBoundary>{loading ? <CircularProgress /> : children}</ErrorBoundary>
    </AppContext.Provider>
  );
};

/* Fin src\context\AppContext.tsx */