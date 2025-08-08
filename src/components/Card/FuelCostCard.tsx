'use client';
import React from 'react';
import { FaGasPump } from 'react-icons/fa';

const FuelCostCard = () => {
  return (
    <div className="flex items-center justify-between text-white">
      <div>
        <h3 className="text-lg font-semibold">Fuel Cost</h3>
        <p className="text-2xl font-bold">$12,500</p>
      </div>
      <FaGasPump className="text-4xl" />
    </div>
  );
};

export default FuelCostCard;