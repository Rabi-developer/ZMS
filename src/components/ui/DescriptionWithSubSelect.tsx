import React from 'react';
import { UseFormRegister, FieldValues } from 'react-hook-form';

// Add a generic type for form data
type DefaultFormData = Record<string, any>;

interface DescriptionWithSubSelectProps<T extends FieldValues = DefaultFormData> {
  label: string;
  name: keyof T;
  subName: string;
  options: { id: string; name: string; subDescription?: string }[];
  selectedOption: string;
  selectedSubOptions: string[];
  onChange: (value: string) => void;
  onSubChange: (values: string[]) => void;
  error?: string;
  subError?: string;
  register: UseFormRegister<T>;
}

const DescriptionWithSubSelect = <T extends FieldValues = DefaultFormData>(
  props: DescriptionWithSubSelectProps<T>
) => {
  const {
    label,
    name,
    subName,
    options,
    selectedOption,
    selectedSubOptions,
    onChange,
    onSubChange,
    error,
    subError,
    register,
  } = props;

  const selectedItem = options.find((option) => option.id === selectedOption);
  const subOptions = selectedItem?.subDescription
    ? selectedItem.subDescription
        .split('|')
        .filter((s) => s)
        .map((subDesc, index) => ({
          id: `${index}`,
          name: subDesc.trim(),
        }))
    : [];

  const handleSubChange = (subId: string) => {
    const newSubOptions = selectedSubOptions.includes(subId)
      ? selectedSubOptions.filter((id) => id !== subId)
      : [...selectedSubOptions, subId];
    onSubChange(newSubOptions);
  };

  return (
    <div className="w-full mb-4">
      <div className="relative">
        <label
          htmlFor={name as string}
          className="block text-lg font-medium text-gray-700 mb-2 transition-all duration-300"
        >
          {label}
        </label>
        <select
          {...register(name as any)}
          value={selectedOption}
          onChange={(e) => {
            onChange(e.target.value);
            onSubChange([]); // Reset sub-selections when main selection changes
          }}
          className={`w-full px-4 py-3 rounded-t-lg text-[#6d6d6d] bg-white border-2 border-[#06b6d4] hover:border-[#06b6d4] focus:outline-none focus:ring-2 focus:ring-[#06b6d4] shadow-md transition-all duration-300 ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          } ${subOptions.length > 0 ? '' : 'rounded-b-lg'}`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      {subOptions.length > 0 && (
        <div className="mt-4">
          
          <div
            className={`w-full bg-white rounded-b-lg shadow-xl border-2 border-[#06b6d4] transition-all duration-300 ${
              subError ? 'border-red-500' : ''
            } ${subOptions.length >= 3 ? 'max-h-[6rem] overflow-y-auto' : 'h-auto'}`}
          >
            {subOptions.map((subOption) => (
              <div
                key={subOption.id}
                className={`px-4 py-2 text-gray-800 hover:bg-[#ecfcff] hover:text-[#06b6d4] cursor-pointer transition-colors duration-200 flex items-center ${
                  selectedSubOptions.includes(subOption.id) ? 'bg-[#06b6d4] text-white' : ''
                }`}
              >
                <input
                  type="checkbox"
                  id={`${subName}-${subOption.id}`}
                  checked={selectedSubOptions.includes(subOption.id)}
                  onChange={() => handleSubChange(subOption.id)}
                  className="mr-2 text-[#06b6d4] focus:ring-[#06b6d4] border-gray-300 rounded"
                />
                <label
                  htmlFor={`${subName}-${subOption.id}`}
                  className="text-sm text-gray-800"
                >
                  {subOption.name}
                </label>
              </div>
            ))}
          </div>
          {subError && <p className="text-red-500 text-sm mt-2">{subError}</p>}
        </div>
      )}
    </div>
  );
};

export default DescriptionWithSubSelect;