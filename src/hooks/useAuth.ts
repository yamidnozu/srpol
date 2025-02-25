/* src/hooks/useAuth.ts */
import { useContext } from 'react';
import { AuthContext, AuthContextProps } from '../context/AuthContext';

export const useAuth = (): AuthContextProps => {
    const context = useContext<AuthContextProps>(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within a AuthProvider");
    }
    return context;
};