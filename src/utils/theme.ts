// src/utils/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Color primario
        },
        secondary: {
            main: '#dc004e', // Color secundario
        },
        background: {
            default: '#f4f6f8', // Fondo general
            paper: '#ffffff', // Fondos de componentes
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Mantener el texto en su forma original
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    marginTop: '8px',
                    marginBottom: '8px',
                },
            },
        },
    },
});

export default theme;
