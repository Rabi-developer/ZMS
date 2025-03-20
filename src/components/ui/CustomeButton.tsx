// CustomButton.tsx
import React from 'react';

interface CustomButtonProps {
  text: string;
  onClick: () => void;
  type: 'button' | 'submit';
  customStyles?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ text, onClick, type, customStyles }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-[#606fe6] text-white rounded-lg py-2 px-4 shadow-[rgba(45,35,66,.4)_0_2px_4px,rgba(45,35,66,.3)_0_7px_13px_-3px,rgba(58,65,111,.5)_0_-3px_0_inset] text-lg font-mono transition-all duration-150 transform-none hover:shadow-[rgba(45,35,66,.4)_0_4px_8px,rgba(45,35,66,.3)_0_7px_13px_-3px,#3c4fe0_0_-3px_0_inset] hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2 ${customStyles}`}
    >
      {text}
    </button>
  );
};

export default CustomButton;
