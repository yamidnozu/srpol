import { useContext } from 'react';
import { AppContext, AppContextProps } from '../context/AppContext';

export const useMenu = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useMenu must be used within a AppProvider")
  }
  return context;
};