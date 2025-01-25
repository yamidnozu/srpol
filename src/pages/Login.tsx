// src/pages/Login.tsx
import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import PublicLayout from "../components/layout/PublicLayout";

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (newValue: number) => {
    // Simplificamos el handler
    setTabValue(newValue);
  };

  return (
    <PublicLayout>
      <div className="max-w-md w-full">
        {" "}
        {/* Contenedor principal con Tailwind */}
        <div className="bg-white shadow-md rounded-lg p-6">
          {" "}
          {/* Reemplaza Paper con div y clases */}
          <div className="flex justify-center border-b border-gray-200 mb-4">
            {" "}
            {/* Reemplaza Tabs con divs */}
            <button
              className={`py-2 px-4 -mb-px border-b-2 ${
                tabValue === 0
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent hover:border-gray-300"
              } font-semibold`}
              onClick={() => handleChange(0)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`py-2 px-4 -mb-px border-b-2 ${
                tabValue === 1
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent hover:border-gray-300"
              } font-semibold`}
              onClick={() => handleChange(1)}
            >
              Registrarse
            </button>
          </div>
          {tabValue === 0 && <LoginForm />}
          {tabValue === 1 && <RegisterForm />}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
