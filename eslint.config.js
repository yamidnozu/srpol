import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.{ts,tsx}"], // Asegúrate de incluir esto para que se aplique a archivos TS/TSX
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], //  <- Ruta a tu tsconfig.json
        tsconfigRootDir: import.meta.dirname, // <-  Directorio raíz para tsconfig.json
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
);