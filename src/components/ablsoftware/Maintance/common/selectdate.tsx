import { FieldError } from "react-hook-form";
import { useEffect, useRef } from "react";

interface SelectDateProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: FieldError | undefined;
  required?: boolean;
}

const SelectDate: React.FC<SelectDateProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync the input value with the prop value (convert DD-MM-YYYY to YYYY-MM-DD for input)
  useEffect(() => {
    if (inputRef.current && value) {
      // Convert DD-MM-YYYY to YYYY-MM-DD for the native date input
      const [day, month, year] = value.split("-");
      if (day && month && year) {
        inputRef.current.value = `${year}-${month}-${day}`;
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // Native date input returns YYYY-MM-DD
    if (dateValue) {
      // Convert YYYY-MM-DD to DD-MM-YYYY
      const [year, month, day] = dateValue.split("-");
      const formattedDate = `${day}-${month}-${year}`;
      onChange(formattedDate);
    } else {
      onChange("");
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-sm font-medium text-black dark:text-white"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          id={id}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input ${
            error ? "border-red-500" : ""
          }`}
          onChange={handleChange}
          placeholder="dd-mm-yyyy"
          required={required}
        />
        {error && (
          <div className="text-red-500 text-xs mt-1">
            {error.message || "An error occurred"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectDate;