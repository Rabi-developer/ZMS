import React from 'react';
import { UseFormRegister } from "react-hook-form";

interface CustomDropdownProps {
  label: string;
  options: { id: string | number; name: string }[];
  selectedOption: string;
  onChange: (value: string) => void;
  error?: string; 
  borderColor?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  borderThickness?: string;
  variant?: 'default' | 'floating';
  register?: UseFormRegister<any>;
}

const CustomInputDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  selectedOption,
  onChange,
  error,
  borderColor = '#06b6d4',
  focusBorderColor = '#06b6d4',
  hoverBorderColor = 'cyan-500',
  borderThickness = '2',
  variant = 'default',
  register,
}) => {

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <div className="relative w-full mb-4">
        <label htmlFor="dropdown" className="block text-lg text-black text-start mb-1">
          {label}
        </label>
        <select
          id="dropdown"
          value={selectedOption}  {...register} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg text-black placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4
            focus:ring-[${focusBorderColor}] focus:border-[${focusBorderColor}]
            border-${borderThickness} border-[${borderColor}] 
            hover:border-[${hoverBorderColor}] transition-all duration-300 bg-gray-100
            ${error ? "border-red-500 focus:ring-red-500" : ""}`} 
        >
          <option value="">Select an option</option>
          {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>} 
      </div>
    </div>
  );
};

export default CustomInputDropdown;
