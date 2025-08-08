'use client';
import React from 'react';
import TotalVehiclesCard from '@/components/Card/TotalVehiclesCard';
import TotalDeliveriesCard from '@/components/Card/TotalDeliveriesCard';
import FuelCostCard from '@/components/Card/FuelCostCard';
import MaintenanceCostCard from '@/components/Card/MaintenanceCostCard';
import FuelUsageGraph from '@/components/Design/Graph/FuelUsageGraph';
import MaintenanceGraph from '@/components/Design/Graph/MaintenanceGraph';
import DeliveryGraph from '@/components/Design/Graph/DeliveryGraph';

const ABLDashboardlayout = () => {
  return (
    <div className="pb-4 grid rounded bg-white mt-20 h-[100vh] overflow-y-auto gap-5 dark:bg-[#1a2a22]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <TotalVehiclesCard />
        </div>
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <TotalDeliveriesCard />
        </div>
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <FuelCostCard />
        </div>
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <MaintenanceCostCard />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <DeliveryGraph />
        </div>
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <FuelUsageGraph />
        </div>
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <MaintenanceGraph />
        </div>
      </div>
    </div>
  );
};

export default ABLDashboardlayout;