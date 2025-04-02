'use client';
import React, { useState } from "react";
import AccountToggle from "./AccountToggle";
import SidebarMenu from "./SidebarMenu";
import { FiMenu } from "react-icons/fi";


const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => {
  return (
    <div
      className={`bg-[#ffffff]   shadow-right-dark fixed top-0 left-0 h-full z-20 transition-all duration-300 overflow-y-auto dark:bg-[#030630]  ${
        isCollapsed ? "w-18" : " w-[310px]"
      }`}
    >
      
      {/* Sidebar Content */}
      <div>
        {/* Toggle Button */}
      <div className="flex justify-end h-2 p-2 mt-12">
        <button
          onClick={onToggle}
          className="rounded-full p-2 focus:outline-none "
          aria-label="Toggle Sidebar"
        >
            {isCollapsed ? <FiMenu  size={24} color="" /> : <FiMenu  size={24}  />}
            </button>
      </div>
   

    <div className="mt-7">
      <SidebarMenu isCollapsed={isCollapsed} />
    </div>
      </div>
    </div>
  );
};

export default Sidebar;
