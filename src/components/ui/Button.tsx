/* src\components\ui\Button.tsx */
import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "text" | "outlined" | "contained"; // Define variants if needed
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success"
    | "inherit"; // Define colors if needed
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "contained", // Default variant
  color = "primary", // Default color
  className,
  ...props
}) => {
  let buttonClasses =
    "font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";

  // Color and variant styles (customize as needed)
  if (variant === "contained") {
    if (color === "primary") {
      buttonClasses += " bg-blue-500 hover:bg-blue-700 text-white";
    } else if (color === "secondary") {
      buttonClasses += " bg-red-500 hover:bg-red-700 text-white";
    } else if (color === "error") {
      buttonClasses += " bg-red-600 hover:bg-red-800 text-white";
    } else if (color === "warning") {
      buttonClasses += " bg-yellow-500 hover:bg-yellow-700 text-gray-800";
    } else if (color === "success") {
      buttonClasses += " bg-green-500 hover:bg-green-700 text-white";
    } else {
      // Default primary
      buttonClasses += " bg-blue-500 hover:bg-blue-700 text-white";
    }
  } else if (variant === "outlined") {
    if (color === "primary") {
      buttonClasses +=
        " border border-blue-500 hover:bg-blue-100 text-blue-700";
    } else if (color === "secondary") {
      buttonClasses += " border border-red-500 hover:bg-red-100 text-red-700";
    } else if (color === "error") {
      buttonClasses += " border border-red-600 hover:bg-red-100 text-red-800";
    } else if (color === "warning") {
      buttonClasses +=
        " border border-yellow-500 hover:bg-yellow-100 text-yellow-700";
    } else if (color === "success") {
      buttonClasses +=
        " border border-green-500 hover:bg-green-100 text-green-700";
    } else {
      // Default primary
      buttonClasses +=
        " border border-blue-500 hover:bg-blue-100 text-blue-700";
    }
  } else {
    // Default contained
    if (color === "primary") {
      buttonClasses += " bg-blue-500 hover:bg-blue-700 text-white";
    } else {
      // Default primary
      buttonClasses += " bg-blue-500 hover:bg-blue-700 text-white";
    }
  }

  return (
    <button {...props} className={`${buttonClasses} ${className || ""}`}>
      {children}
    </button>
  );
};

export default Button;