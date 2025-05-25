import React, { useState, useRef, useEffect } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { DateRangePicker, RangeKeyDict, Range } from 'react-date-range';
import { format, parseISO } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface CustomDateRangePickerProps {
  label: string;
  selectedRange: { startDate: string; endDate: string };
  onChange: (range: { startDate: string; endDate: string }) => void;
  error?: string;
  borderColor?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  borderThickness?: string;
  variant?: 'default' | 'floating';
  register?: UseFormRegister<any>;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  label,
  selectedRange,
  onChange,
  error,
  borderColor = '#0899b2',
  focusBorderColor = '#0899b2',
  hoverBorderColor = '#0899b2',
  borderThickness = '2',
  variant = 'default',
  register,
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

  // Format the selected range for display
  const displayText = selectedRange.startDate && selectedRange.endDate
    ? `${format(parseISO(selectedRange.startDate), 'MMM dd, yyyy')} - ${format(parseISO(selectedRange.endDate), 'MMM dd, yyyy')}`
    : '';

  // Handle date range selection
  const handleSelect = (ranges: RangeKeyDict) => {
    const { startDate, endDate } = ranges.selection;
    if (startDate && endDate) {
      onChange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
      setIsOpen(false);
    }
  };

  // Convert selectedRange to Date objects for DateRangePicker
  const dateRange: Range = {
    startDate: selectedRange.startDate ? parseISO(selectedRange.startDate) : new Date(),
    endDate: selectedRange.endDate ? parseISO(selectedRange.endDate) : new Date(),
    key: 'selection',
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative w-full mb-4">
        <label
          htmlFor="dateRange"
          className={`block text-lg font-medium text-gray-700 mb-2 transition-all duration-300 ${
            variant === 'floating' && isOpen ? 'transform -translate-y-6 scale-75' : ''
          }`}
        >
          {label}
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder="Select date range"
            value={displayText}
            readOnly
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-3 rounded-t-lg text-[#6d6d6d] placeholder-gray-400 shadow-md focus:outline-none focus:ring-2
              focus:ring-${focusBorderColor} border-${borderThickness} border-${borderColor}
              hover:border-${hoverBorderColor} transition-all duration-300 bg-white
              ${error ? 'border-red-500 focus:ring-red-500' : ''} ${isOpen ? '' : 'rounded-b-lg'}`}
          />

          {isOpen && (
            <div
              className={`absolute w-full bg-white rounded-b-lg shadow-xl z-10 border-${borderThickness} border-${borderColor}`}
            >
              <DateRangePicker
                onChange={handleSelect}
                ranges={[dateRange]}
                moveRangeOnFirstSelection={false}
                months={2}
                direction="horizontal"
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Hidden inputs for react-hook-form integration */}
        {register && (
          <>
            <input
              type="hidden"
              {...register(`${label}.startDate`)}
              value={selectedRange.startDate}
            />
            <input
              type="hidden"
              {...register(`${label}.endDate`)}
              value={selectedRange.endDate}
            />
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default CustomDateRangePicker;