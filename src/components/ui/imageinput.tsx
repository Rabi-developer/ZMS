import React, { useState } from 'react';
import { FieldError, UseFormRegister } from 'react-hook-form';

interface ImageInputProps {
  id: string;
  label: string;
  register: UseFormRegister<any>; // UseFormRegister to type the register function
  error?: FieldError; // Error object from react-hook-form
  required?: boolean;
  className?: string;
}

const ImageInput: React.FC<ImageInputProps> = ({
  id,
  label,
  register,
  error,
  required = false,
  className = "",
}) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className={`form-group ${className}`}>
      <label
        htmlFor={id}
        className="mb-3 block text-sm font-medium text-black dark:text-white"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="file"
          accept="image/*"
          {...register(id, { required })}
          onChange={handleFileChange}
          className={`absolute opacity-0 w-full h-full cursor-pointer`}
        />
        <div
          className={`flex items-center justify-between border border-stroke bg-white px-4 py-3 rounded focus-within:ring-2 focus-within:ring-[#3c50e0] transition-all ${
            error ? 'border-red-500' : 'border-grey-500 border-2'
          }`}
        >
          <span className="text-gray-500">{fileName || (!error ? 'No file chosen' : error.message)}</span>
          <button
            type="button"
            aria-label="Choose file"
            className="text-[#06b6d4] hover:text-[#1e40af] font-semibold"
          >
            Choose File
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error.message}</p> 
      )}
    </div>
  );
};

export default ImageInput;
