'use client';

import React, { useState } from 'react';
import CustomInput from '@/components/ui/CustomInput';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import CustomButton from '../ui/CustomeButton';
import CustomCheckbox from '@/components/ui/CustomeCheckbox';  
import CheckboxGroup from '@/components/ui/CheckboxGroup';

const Company = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [inputText, setInputText] = useState('');
  const [isChecked, setIsChecked] = useState(false); 
  const [checkboxValues, setCheckboxValues] = useState({
    subscribe: false,
    offer: false,
    updates: false,
  });

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);  // Update checkbox state
  };

  const handleCheckboxChanges = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean, name: string) => {
    setCheckboxValues((prevValues) => ({
      ...prevValues,
      [name]: checked,  
    }));
  };

  const countryOptions = ['United States', 'Canada', 'Australia', 'Germany', 'United Kingdom'];

  const handleSubmit = () => {
    console.log('Submitted Data:');
    console.log('Country:', selectedCountry);
    console.log('Input Text:', inputText);
    console.log('Checkboxes:', checkboxValues);  
  };

  return (
    <div className="h-[calc(100vh-32px-48px)]">
      <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
        {/* Generic Customizable Input */}
        <div className="w-full max-w-sm">
          
        </div>


     

        <div className="w-full max-w-sm">
          <CustomCheckbox
            size={40}
            checked={isChecked}
            onChange={handleCheckboxChange}
            colorGradient="linear-gradient(90deg, #00b4d8, #00b4d8)"
          />
          <label htmlFor="subscribe" className="ml-2 text-sm font-semibold">
            Subscribe to newsletter
          </label>
        </div>

        {/* Checkbox Group with Different Colors */}
        <div className="w-full max-w-sm">
          <CheckboxGroup
            label="Subscribe to newsletter"
            checkboxes={[
              { label: 'Inventory', defaultChecked: checkboxValues.subscribe, color: '#00b4d8' },
              { label: 'Special ', defaultChecked: checkboxValues.offer, color: '#ff5733' },
              { label: 'Product ', defaultChecked: checkboxValues.updates, color: '#4CAF50' },
            ]}
            onChange={handleCheckboxChanges}
          />
        </div>

        {/* Submit Button */}
        <div className="w-full max-w-sm">
          <CustomButton
            text="Submit"
            onClick={handleSubmit}
            type="button" 
            customStyles="w-full" 
          />
        </div>
      </div>
    </div>
  );
};

export default Company;
