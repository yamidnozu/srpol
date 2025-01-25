/* src\components\ui\TextField.tsx */
import React, { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const TextField: React.FC<TextFieldProps> = ({
  label,
  className,
  ...props
}) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          className || ""
        }`}
      />
    </div>
  );
};

export default TextField;
