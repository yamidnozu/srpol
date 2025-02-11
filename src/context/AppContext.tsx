/* src\context\AppContext.tsx */
/* src\context\AppContext.tsx */
import { CircularProgress } from "@mui/material";
import { collection, onSnapshot } from "firebase/firestore";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import ErrorBoundary from "../components/ui/ErrorBoundry";
import { COLLECTIONS } from "../utils/constants";
import { db } from "../utils/firebase";

export interface MenuItem {
  // Exporta la interfaz MenuItem
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
    | "noDisponibleLargoPlazo";
  cost: number;
  points: number;
  imageUrls: string[];
  isCombo: boolean;
  components: string[];
  minimumPrice: number;
  comboSellingPrice: number;
  comboPoints: number;
  additionalCosts: AdditionalCost[];
}
export interface AdditionalCost {
  nombre: string;
  valor: number;
}
export type MenuItemType = MenuItem; // Define y exporta MenuItemType como alias de MenuItem

export interface AppContextProps {
  menu: MenuItemType[]; // Usa MenuItemType aquí
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
  const [menu, setMenu] = useState<MenuItemType[]>([]); // Usa MenuItemType aquí
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsubscribe: () => void;
    try {
      const menuCollection = collection(db, COLLECTIONS.MENU);
      unsubscribe = onSnapshot(menuCollection, (snapshot) => {
        const menuData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MenuItemType) // Cassting a MenuItemType
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
