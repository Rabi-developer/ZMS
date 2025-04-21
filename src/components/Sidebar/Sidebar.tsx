'use client';
import React from "react";
import AccountToggle from "./AccountToggle";
import SidebarMenu from "./SidebarMenu";
import { FiMenu } from "react-icons/fi";

const Sidebar = ({
  isCollapsed,
  onToggle,
  searchQuery,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  searchQuery: string;
}) => {
  return (
    <div
      className={`bg-[#ffffff] shadow-right-dark  fixed top-0 left-0 h-full transition-all duration-300 overflow-y-auto dark:bg-[#030630] ${
        isCollapsed ? "w-19" : "w-[330px]"
      }`}
    >
      {/* Sidebar Content */}
      <div>
        {/* Toggle Button */}
        <div className="flex justify-end h-2 p-2 mt-12 dark:text-white">
          <button
            onClick={onToggle}
            className="rounded-full p-2 focus:outline-none mt-3"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <FiMenu size={27} color="" /> : <FiMenu size={27} />}
          </button>
        </div>

        <div className="mt-11">
          <SidebarMenu isCollapsed={isCollapsed} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;