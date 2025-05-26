import React, { useState, useRef, useEffect } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Calendar } from 'react-date-range';
import { format, parseISO } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface CustomSingleDatePickerProps {
  label: string;
  selectedDate: string;
  onChange: (date: string) => void;
  error?: string;
  borderColor?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  borderThickness?: string;
  variant?: 'default' | 'floating';
  register?: UseFormRegister<any>;
  name: string;
}

const CustomSingleDatePicker: React.FC<CustomSingleDatePickerProps> = ({
  label,
  selectedDate,
  onChange,
  error,
  borderColor = '#06b6d4',
  focusBorderColor = '#0899b2',
  hoverBorderColor = '#06b6d4',
  borderThickness = '2',
  variant = 'default',
  register,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format the selected date for display
  const displayText = selectedDate ? format(parseISO(selectedDate), 'MMM dd, yyyy') : '';

  // Handle date selection
  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  // Convert selectedDate to Date object for Calendar
  const date = selectedDate ? parseISO(selectedDate) : new Date();

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative w-full mb-4">
        <label
          htmlFor={name}
          className={`block text-lg font-medium text-gray-700 mb-2 transition-all duration-300 ${
            variant === 'floating' && isOpen ? 'transform -translate-y-6 scale-75' : ''
          }`}
        >
          {label}
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder={`Select ${label}`}
            value={displayText}
            readOnly
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-3 rounded-t-lg text-[#6d6d6d] border-[#06b6d4] placeholder-gray-400 shadow-md focus:outline-none focus:ring-2
              focus:ring-${focusBorderColor} border-${borderThickness} border-${borderColor}
              hover:border-${hoverBorderColor} transition-all duration-300 bg-white
              ${error ? 'border-red-500 focus:ring-red-500' : ''} ${isOpen ? '' : 'rounded-b-lg'}`}
          />

          {isOpen && (
            <div
              className={`absolute w-full bg-white rounded-b-lg shadow-xl z-10 border-${borderThickness} border-${borderColor}`}
            >
              <Calendar
                date={date}
                onChange={handleSelect}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Hidden input for react-hook-form integration */}
        {register && (
          <input
            type="hidden"
            {...register(name)}
            value={selectedDate}
          />
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default CustomSingleDatePicker;