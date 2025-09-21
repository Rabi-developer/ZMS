import React from 'react';
import { UseFormRegister } from 'react-hook-form';

interface ABLCustomInputProps {
  label: string;
  type?: string;
  disabled?: boolean;
  variant?: 'default' | 'floating';
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
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
}

const ABLNewCustomInput: React.FC<ABLCustomInputProps> = ({
  label,
  type = 'text',
  disabled = false,
  variant = 'default',
  borderColor = '#3a614c',
  focusBorderColor = '#4a7a5e',
  hoverBorderColor = '#4a7a5e',
  borderThickness = '2',
  placeholder = 'Enter text here',
  id = 'input',
  error,
  register,
  className = '',
  ...rest
}) => {
  const baseInputClassNames = `w-full h-11 px-3 py-2 rounded-lg text-black placeholder-gray-500 shadow-md focus:outline-none focus:ring-4
    focus:ring-[${focusBorderColor}] focus:border-[${focusBorderColor}]
    border-${borderThickness} border-[${borderColor}]
    hover:border-[${hoverBorderColor}] transition-all duration-200
    bg-gray-100
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${disabled ? 'bg-gray-200 cursor-not-allowed' : ''}
    ${className}`;

  return (
    <div className="mb-4 text-gray-900 flex items-center gap-4">
      <label
        htmlFor={id}
        className="w-32 h-11 flex items-center text-lg font-semibold text-gray-700 whitespace-nowrap"
      >
        {label}
      </label>
      <div className="flex-1">
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
      </div>
      <style jsx>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #e6f8e6 inset !important;
          -webkit-text-fill-color: #3a614c !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        input.auto-calculated-field:-webkit-autofill,
        input.auto-calculated-field:-webkit-autofill:hover,
        input.auto-calculated-field:-webkit-autofill:focus,
        input.auto-calculated-field:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #d4e8d9 inset !important;
          -webkit-text-fill-color: #2e4c3d !important;
        }
      `}</style>
    </div>
  );
};

export default ABLNewCustomInput;