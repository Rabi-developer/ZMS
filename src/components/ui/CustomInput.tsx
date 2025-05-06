import React from "react";
import { UseFormRegister } from "react-hook-form";

interface CustomInputProps {
  label: string;
  type?: string;
  disabled?: boolean;
  variant?: "default" | "floating";
  borderColor?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  borderThickness?: string;
  placeholder?: string;
  id?: string;
  error?: string;
  register?: UseFormRegister<any>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;                                  
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  type = "text",
  disabled = false,
  variant = "default",
  borderColor = "#06b6d4",
  focusBorderColor = "#06b6d4",
  hoverBorderColor = "#06b6d4",
  borderThickness = "2",
  placeholder = "Enter text here",
  id = "input",
  error,
  register,
  className = "", // Default to empty string
  ...rest
}) => {
  const baseInputClassNames = `w-full px-3 py-2 rounded-lg text-black placeholder-gray-500 shadow-md focus:outline-none focus:ring-4
    focus:ring-[${focusBorderColor}] focus:border-[${focusBorderColor}]
    border-${borderThickness} border-[${borderColor}]
    hover:border-[${hoverBorderColor}] transition-all duration-200
    bg-gray-100
    ${error ? "border-red-500 focus:ring-red-500" : ""}
    ${disabled ? "bg-gray-200 cursor-not-allowed" : ""}
    ${className}`;
  if (variant === "floating") {
    return (
      <div className="relative w-full mt-8">
        <input
          id={id}
          type={type}
          placeholder=" " 
          disabled={disabled}
          className={`peer w-full px-3 py-2 bg-[#f3f4f6] border-${borderThickness} rounded-lg text-gray-800 placeholder-transparent
            border-[${borderColor}] focus:border-[${focusBorderColor}] focus:ring-2 focus:ring-[${focusBorderColor}]
            hover:border-[${hoverBorderColor}] focus:outline-none transition-all duration-150 shadow-md
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${disabled ? "bg-gray-200 cursor-not-allowed" : ""}
            ${className}`} 
          {...(register && register(id))}
          {...rest}
        />
        <label
          htmlFor={id}
          className={`absolute left-4 top-2 text-black bg-white px-1 transition-all duration-300 transform
            ${rest.value || placeholder ? "scale-90 -translate-y-4" : "scale-100 translate-y-0"}
            peer-focus:scale-90 peer-focus:-translate-y-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
            peer-focus:text-[${focusBorderColor}]`}
        >
          {label}
        </label>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <style jsx>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #e0f7fa inset !important;
            -webkit-text-fill-color: #0288d1 !important;
            transition: background-color 5000s ease-in-out 0s;
          }
          /* Override autofill styles for auto-calculated-field class */
          input.auto-calculated-field:-webkit-autofill,
          input.auto-calculated-field:-webkit-autofill:hover,
          input.auto-calculated-field:-webkit-autofill:focus,
          input.auto-calculated-field:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #b9ecfe inset !important;
            -webkit-text-fill-color: #00a2da !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mb-4 text-gray-900">
      <label className="block text-lg font-semibold text-gray-700 text-start mb-1">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={baseInputClassNames}
        {...(register && register(id))}
        {...rest}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {/* Inline CSS for autofill styling */}
      <style jsx>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #e0f7fa inset !important;
          -webkit-text-fill-color: #0288d1 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        /* Override autofill styles for auto-calculated-field class */
        input.auto-calculated-field:-webkit-autofill,
        input.auto-calculated-field:-webkit-autofill:hover,
        input.auto-calculated-field:-webkit-autofill:focus,
        input.auto-calculated-field:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #b9ecfe inset !important;
          -webkit-text-fill-color: #00a2da !important;
        }
      `}</style>
    </div>
  );
};
export default CustomInput;