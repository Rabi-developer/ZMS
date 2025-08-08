'use client';
import React from 'react';
import { GiRoad } from 'react-icons/gi';

const TotalDeliveriesCard = () => {
  return (
    <div className="flex items-center justify-between text-white">
      <div>
        <h3 className="text-lg font-semibold">Total Deliveries</h3>
        <p className="text-2xl font-bold">1,245</p>
      </div>
      <GiRoad className="text-4xl" />
    </div>
  );
};

export default TotalDeliveriesCard;