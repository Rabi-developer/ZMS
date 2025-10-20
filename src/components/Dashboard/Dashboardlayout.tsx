'use client';
import React from 'react';
import TotalLossCard from '../Card/TotalLossCard';
import TotalInventoryCard from '../Card/TotalInventoryCard';
import TotalProfitCard from '../Card/TotalProfitCard';
import TotalStockCard from '../Card/TotalStockCard';
import { SaleGraph } from '../Design/Graph/SaleGraph';
import { ProductGraph } from '../Design/Graph/ProductGraph';
import { ItemsGraph } from '../Design/Graph/ItemsGraph';

const dashboardlayout = () => {
  return (
    <div className='pb-4 grid rounded bg-white mt-20 h-[100vh] overflow-y-auto scrollbar-thin scrollbar-rounded gap-5
        dark:bg-[#030630]
        '>
      {/* First Row - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ">
        <div className="p-4 bg-[#06b6d4] rounded shadow-2xl drop-shadow-lg rounded-2xl  rounded-md dark:bg-[#387fbf] ">
          <TotalStockCard />
        </div>
        <div className="p-4 bg-[#06b6d4] rounded shadow-2xl drop-shadow-lg rounded-2xl rounded-md dark:bg-[#387fbf]  ">
          <TotalInventoryCard />
        </div>
        <div className="p-4 bg-[#06b6d4] rounded shadow-2xl drop-shadow-lg rounded-2xl rounded-md dark:bg-[#387fbf] ">
          <TotalLossCard />
        </div>
        <div className="p-4 bg-[#06b6d4] rounded shadow-2xl drop-shadow-lg rounded-2xl  rounded-md dark:bg-[#387fbf] ">
          <TotalProfitCard />
        </div>
      </div>

      {/* Second Row - Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-4 rounded shadow-xl">
          <SaleGraph />
        </div>
        <div className="p-4  rounded shadow-xl">
          <ProductGraph />
        </div>
        <div className="p-4  rounded shadow-xl">
          <ItemsGraph />
        </div>
      </div>
    </div>
  );
}

export default dashboardlayout;
