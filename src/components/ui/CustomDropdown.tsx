import React, { useState } from 'react';
import { UseFormRegister } from "react-hook-form";

interface DropdownOption {
  id: string;
  name: string;
}

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[]; 
  variant?: 'default' | 'floating';
  borderColor?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  borderThickness?: string;
  id?: string;
  register?: UseFormRegister<any>;
  selectedOption?: string;
  onChange?: (value: string) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  variant = 'default',
  borderColor = '#06b6d4',
  focusBorderColor = '#06b6d4',
  hoverBorderColor = '#06b6d4',
  borderThickness = '1',
  id = 'dropdown',
  selectedOption = '',
  onChange,
  register,
}) => {
  const [selected, setSelected] = useState<string>(selectedOption);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelected(selectedValue);
    onChange && onChange(selectedValue);
  };

  // Floating label variant
  if (variant === 'floating') {
    return (
      <div className="relative w-full max-w-sm mt-8">
        <select
          id={id}
          className={`peer w-full px-3 py-2 border-${borderThickness} rounded-lg text-gray-800
            placeholder-transparent border-[${borderColor}] focus:border-[${focusBorderColor}] focus:ring-2
            focus:ring-[${focusBorderColor}] hover:border-[${hoverBorderColor}] focus:outline-none
            transition-all duration-100 shadow-md`}
          value={selected}
          onChange={handleChange}
        >
          <option value="" disabled>
            {label}
          </option>
          {options.map((option) => (
            <option  {...register && register(id)}  key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <label
          htmlFor={id}
          className={`absolute left-4 top-0.5 text-[${focusBorderColor}] bg-white px-1 transition-all duration-300
            transform ${selected ? 'scale-90 -translate-y-5' : 'scale-100 translate-y-0'}
            peer-focus:scale-90 peer-focus:-translate-y-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
            peer-focus:text-[${focusBorderColor}]`}
        >
          {label}
        </label>
      </div>
    );
  }

};

export default CustomDropdown;
