import React, { useState } from 'react';

interface CustomCheckboxProps {
  size?: number; 
  checked?: boolean; 
  onChange?: (checked: boolean) => void; 
  colorGradient?: string; 
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  size = 40,
  checked = false,
  onChange,
  colorGradient = 'linear-gradient(90deg, #f19af3, #f099b5)',
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);

    if (onChange) {
      onChange(newCheckedState);
    }
  };

  return (
    <div className="checkbox-wrapper-5">
      <div className="check" style={{ '--size': `${size}px`, '--color-gradient': colorGradient } as React.CSSProperties}>
        <input
          id="check-5"
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
        />
        <label htmlFor="check-5" />
      </div>

      <style>
        {`
          .checkbox-wrapper-5 .check {
            --size: ${size}px;
            position: relative;
            background: var(--color-gradient);
            line-height: 0;
            perspective: 400px;
            font-size: var(--size);
          }

          .checkbox-wrapper-5 .check input[type="checkbox"],
          .checkbox-wrapper-5 .check label,
          .checkbox-wrapper-5 .check label::before,
          .checkbox-wrapper-5 .check label::after,
          .checkbox-wrapper-5 .check {
            appearance: none;
            display: inline-block;
            border-radius: var(--size);
            border: 0;
            transition: .35s ease-in-out;
            box-sizing: border-box;
            cursor: pointer;
          }

          .checkbox-wrapper-5 .check label {
            width: calc(2.2 * var(--size));
            height: var(--size);
            background: #d7d7d7;
            overflow: hidden;
          }

          .checkbox-wrapper-5 .check input[type="checkbox"] {
            position: absolute;
            z-index: 1;
            width: calc(.8 * var(--size));
            height: calc(.8 * var(--size));
            top: calc(.1 * var(--size));
            left: calc(.1 * var(--size));
            background: linear-gradient(45deg, #dedede, #ffffff);
            box-shadow: 0 6px 7px rgba(0,0,0,0.3);
            outline: none;
            margin: 0;
          }

          .checkbox-wrapper-5 .check input[type="checkbox"]:checked {
            left: calc(1.3 * var(--size));
          }

          .checkbox-wrapper-5 .check input[type="checkbox"]:checked + label {
            background: transparent;
          }

          .checkbox-wrapper-5 .check label::before,
          .checkbox-wrapper-5 .check label::after {
            content: "· ·";
            position: absolute;
            overflow: hidden;
            left: calc(.15 * var(--size));
            top: calc(.5 * var(--size));
            height: var(--size);
            letter-spacing: calc(-0.04 * var(--size));
            color: #9b9b9b;
            font-family: "Times New Roman", serif;
            z-index: 2;
            font-size: calc(.6 * var(--size));
            border-radius: 0;
            transform-origin: 0 0 calc(-0.5 * var(--size));
            backface-visibility: hidden;
          }

          .checkbox-wrapper-5 .check label::after {
            content: "●";
            top: calc(.65 * var(--size));
            left: calc(.2 * var(--size));
            height: calc(.1 * var(--size));
            width: calc(.35 * var(--size));
            font-size: calc(.2 * var(--size));
            transform-origin: 0 0 calc(-0.4 * var(--size));
          }

          .checkbox-wrapper-5 .check input[type="checkbox"]:checked + label::before,
          .checkbox-wrapper-5 .check input[type="checkbox"]:checked + label::after {
            left: calc(1.55 * var(--size));
            top: calc(.4 * var(--size));
            line-height: calc(.1 * var(--size));
            transform: rotateY(360deg);
          }

          .checkbox-wrapper-5 .check input[type="checkbox"]:checked + label::after {
            height: calc(.16 * var(--size));
            top: calc(.55 * var(--size));
            left: calc(1.6 * var(--size));
            font-size: calc(.6 * var(--size));
            line-height: 0;
          }
        `}
      </style>
    </div>
  );
};

export default CustomCheckbox;
