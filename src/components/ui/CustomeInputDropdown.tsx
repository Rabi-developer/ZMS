import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  borderColor = '#0899b2',
  focusBorderColor = '##0899b2',
  hoverBorderColor = '##0899b2',
  borderThickness = '2',
  variant = 'default',
  register,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort options
  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) {
      return [];
    }

    let result = options.filter(option => 
      option && 
      typeof option.name === 'string' && 
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      const comparison = nameA.localeCompare(nameB);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [options, searchTerm, sortOrder]);

  const handleSelect = (value: string) => {
    onChange(value);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get display text for input
  const displayText = selectedOption 
    ? options.find(option => option.id.toString() === selectedOption)?.name || 'Select an option-Search'
    : 'Select an option-Search';

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative w-full mb-4">
        <label
          htmlFor="dropdown"
          className={`block text-lg font-medium text-gray-700 mb-2 transition-all duration-300 ${
            variant === 'floating' && isOpen ? 'transform -translate-y-6 scale-75' : ''
          }`}
        >
          {label}
        </label>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={displayText}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className={`w-full border-${borderColor} border-[#06b6d4]  px-4 py-3 rounded-t-lg text-[#6d6d6d] placeholder-gray-400 shadow-md focus:outline-none focus:ring-2
              focus:ring-${focusBorderColor} border-${borderThickness} border-${borderColor}
              hover:border-${hoverBorderColor} transition-all duration-300 bg-white
              ${error ? 'border-red-500 focus:ring-red-500' : ''} ${isOpen ? '' : 'rounded-b-lg'}`}
          />

          {/* Sort Button */}
          <div className="absolute right-2 top-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 border-${borderThickness} border-${borderColor}`}
            >
              Sort {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute w-full max-h-60 overflow-y-auto bg-white rounded-b-lg shadow-xl z-10 border-${borderThickness} border-${borderColor}`}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id.toString())}
                  className={`px-4 py-2 bg-${borderColor}  text-gray-800 hover:bg-${hoverBorderColor} hover:text-[#06b6d4] hover:bg-[#ecfcff] cursor-pointer transition-colors duration-200
                    ${selectedOption === option.id.toString() ? `bg-${borderColor} ` : ''}`}
                >
                  {option.name}
                </div>
              ))
            )}
          </div>
        )}

        {/* Hidden select for form registration */}
        <select
          id="dropdown"
          value={selectedOption}
          {...register}
          onChange={(e) => onChange(e.target.value)}
          className="hidden"
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