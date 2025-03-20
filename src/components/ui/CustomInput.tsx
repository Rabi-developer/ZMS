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
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  type = "text",
  variant = "default",
  borderColor = "#06b6d4",
  focusBorderColor = "#06b6d4",
  hoverBorderColor = "#06b6d4",
  borderThickness = "2",
  placeholder = "Enter text here", 
  id = "input",
  error,
  register,
  ...rest 
}) => {
  const inputClassNames = `w-full px-3 py-2 rounded-lg text-black placeholder-gray-500 shadow-md focus:outline-none focus:ring-4
    focus:ring-[${focusBorderColor}] focus:border-[${focusBorderColor}]
    border-${borderThickness} border-[${borderColor}]
    hover:border-[${hoverBorderColor}] transition-all duration-200 
    bg-gray-100
    ${error ? "border-red-500 focus:ring-red-500" : ""}`;

  if (variant === "floating") {
    return (
      <div className="relative w-full mt-8">
        <input
          id={id}
          type={type}
          placeholder=" " // Empty placeholder so the label can float
          className={`peer w-full px-3 py-2 bg-[#f3f4f6] border-${borderThickness} rounded-lg text-gray-800 placeholder-transparent
            border-[${borderColor}] focus:border-[${focusBorderColor}] focus:ring-2 focus:ring-[${focusBorderColor}]
            hover:border-[${hoverBorderColor}] focus:outline-none transition-all duration-150 shadow-md
            ${error ? "border-red-500 focus:ring-red-500" : ""}`}
          {...register && register(id)}  
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
      </div>
    );
  }

  return (
    <div className="mb-4 text-gray-900">
      <label className="block text-lg font-semibold text-gray-700 text-start mb-1">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder} // Now properly recognized
        className={inputClassNames}
        {...register && register(id)}  // Register input properly
        {...rest} // Spread any other props like error
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default CustomInput;
