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
  disabled?: boolean;
}

const AblCustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  selectedOption,
  onChange,
  error,
  borderColor = '#4d7c61',
  focusBorderColor = '#4d7c61',
  hoverBorderColor = '#3a614c',
  borderThickness = '2',
  variant = 'default',
  register,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const highlightedIndexRef = useRef(-1);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const updateHighlightedIndex = (index: number) => {
    highlightedIndexRef.current = index;
    setHighlightedIndex(index);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (!disabled) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [disabled]);

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
    if (!disabled) {
      onChange(value);
      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = value;
        nativeSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setIsOpen(false);
      setSearchTerm('');
      setIsTyping(false);
      updateHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (!isOpen || filteredOptions.length === 0) {
      updateHighlightedIndex(-1);
      return;
    }

    const nextIndex = (() => {
      const currentIndex = highlightedIndexRef.current;
      if (currentIndex >= 0 && currentIndex < filteredOptions.length) {
        return currentIndex;
      }

      const selectedIndex = filteredOptions.findIndex(
        (option) => option.id.toString() === selectedOption
      );

      return selectedIndex >= 0 ? selectedIndex : 0;
    })();

    updateHighlightedIndex(nextIndex);
  }, [filteredOptions, isOpen, selectedOption]);

  useEffect(() => {
    if (highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length > 0) {
        const nextIndex =
          highlightedIndexRef.current < filteredOptions.length - 1
            ? highlightedIndexRef.current + 1
            : 0;
        updateHighlightedIndex(nextIndex);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length > 0) {
        const nextIndex =
          highlightedIndexRef.current > 0
            ? highlightedIndexRef.current - 1
            : filteredOptions.length - 1;
        updateHighlightedIndex(nextIndex);
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      const selectedIndex =
        highlightedIndexRef.current >= 0
          ? highlightedIndexRef.current
          : filteredOptions.findIndex((option) => option.id.toString() === selectedOption);

      const optionToSelect =
        filteredOptions[selectedIndex >= 0 ? selectedIndex : 0];

      if (optionToSelect) {
        handleSelect(optionToSelect.id.toString());
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      setIsTyping(false);
      setSearchTerm('');
      updateHighlightedIndex(-1);
    }
  };

  const displayText = selectedOption 
    ? options.find(option => option.id.toString() === selectedOption)?.name || ''
    : '';

  const inputValue = isTyping ? searchTerm : displayText;

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setIsTyping(true);
    setSearchTerm('');
  };

  return (
    <div className="w-full abl-custom-dropdown dropdown" ref={dropdownRef}>
      <div className="relative w-full mb-4">
        <label
          htmlFor="dropdown"
          className={`block text-lg font-medium text-gray-700 mb-2 transition-all duration-300 ${
            variant === 'floating' && isOpen && !disabled ? 'transform -translate-y-6 scale-75' : ''
          } ${disabled ? 'text-gray-400' : ''}`}
        >
          {label}
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder={displayText}
            value={inputValue}
            onChange={(e) => {
              if (disabled) return;
              setIsTyping(true);
              setSearchTerm(e.target.value);
              if (!isOpen) {
                setIsOpen(true);
              }
            }}
            onBlur={() => {
              if (disabled) return;
              setIsTyping(false);
              setSearchTerm('');
            }}
            onFocus={handleOpen}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`w-full px-4 py-3 rounded-t-lg text-[#6d6d6d] placeholder-gray-400 shadow-md focus:outline-none transition-all duration-300 bg-white
              ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : `border-${borderColor} border-[#4d7c61] focus:ring-2 focus:ring-${focusBorderColor} border-${borderThickness} hover:border-${hoverBorderColor}`}
              ${error ? 'border-red-500 focus:ring-red-500' : ''} ${isOpen && !disabled ? '' : 'rounded-b-lg'}`}
          />

          <div className="absolute right-2 top-2">
            <button
              type="button"
              onClick={() => !disabled && setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              disabled={disabled}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 border-${borderThickness} ${
                disabled ? 'bg-gray-200 border-1 text-gray-400 cursor-not-allowed' : `bg-gray-100 hover:bg-gray-200 border-${borderColor}`
              }`}
            >
              Sort {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div
            className={`absolute w-full max-h-60 overflow-y-auto bg-white rounded-b-lg shadow-xl z-10 border-${borderThickness} border-${borderColor}`}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">No options found <span className="text-[#ff0000]">There is no save data first save the data</span></div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.id.toString())}
                  onMouseEnter={() => updateHighlightedIndex(index)}
                  className={`px-4 py-2 text-gray-800 cursor-pointer transition-colors duration-200
                    ${disabled ? 'cursor-not-allowed' : `hover:bg-${hoverBorderColor} hover:text-[#4d7c61] hover:bg-[#e6f0ea]`}
                    ${highlightedIndex === index ? 'bg-[#e6f0ea] text-[#3a614c]' : ''}
                    ${selectedOption === option.id.toString() ? `bg-${borderColor}` : ''}`}
                >
                  {option.name}
                </div>
              ))
            )}
          </div>
        )}

        <select
          id="dropdown"
          ref={nativeSelectRef}
          value={selectedOption}
          {...register}
          onChange={(e) => !disabled && onChange(e.target.value)}
          disabled={disabled}
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

export default AblCustomDropdown;
