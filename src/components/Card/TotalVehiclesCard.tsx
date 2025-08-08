'use client';
import React from 'react';
import { FaTruck } from 'react-icons/fa';

const TotalVehiclesCard = () => {
  return (
    <div className="flex items-center justify-between text-white">
      <div>
        <h3 className="text-lg font-semibold">Total Vehicles</h3>
        <p className="text-2xl font-bold">150</p>
      </div>
      <FaTruck className="text-4xl" />
    </div>
  );
};

export default TotalVehiclesCard;