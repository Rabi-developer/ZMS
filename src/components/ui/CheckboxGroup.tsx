import * as React from 'react';
import { Checkbox } from '@mui/material';

interface CheckboxGroupProps {
  label: string;
  checkboxes: Array<{
    label: string;
    defaultChecked: boolean;
    color: string;
  }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, name: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  checkboxes,
  onChange,
}) => {
  return (
    <div>
      <label>{label}</label>
      <div className='flex'>
        {checkboxes.map((checkbox, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <Checkbox
              name={checkbox.label}
              defaultChecked={checkbox.defaultChecked}
              onChange={(e) => onChange(e, e.target.checked, e.target.name)}
              sx={{
                color: checkbox.color,
                '&.Mui-checked': {
                  color: checkbox.color,
                },
              }}
            />
            <label>{checkbox.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
