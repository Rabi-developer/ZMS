'use client';
import React from 'react';
import { FaTools } from 'react-icons/fa';

const MaintenanceCostCard = () => {
  return (
    <div className="flex items-center justify-between text-white">
      <div>
        <h3 className="text-lg font-semibold">Maintenance Cost</h3>
        <p className="text-2xl font-bold">$8,750</p>
      </div>
      <FaTools className="text-4xl" />
    </div>
  );
};

export default MaintenanceCostCard;