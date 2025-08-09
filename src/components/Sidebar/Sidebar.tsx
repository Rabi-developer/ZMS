'use client';
import React from 'react';
import SidebarMenu from './SidebarMenu';
import { FiMenu } from 'react-icons/fi';

const Sidebar = ({
  isCollapsed,
  onToggle,
  searchQuery,
  activeInterface,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  searchQuery: string;
  activeInterface: 'ZMS' | 'ABL';
}) => {
  return (
    <div
      className={`shadow-right-dark fixed top-0 left-0 h-full transition-all duration-300 ${
        isCollapsed ? 'w-19' : 'w-[330px]'
      } ${activeInterface === 'ABL' ? 'bg-[#1a2a22] dark:bg-[#1a2a22]' : 'bg-white dark:bg-[#030630]'}`}
    >
      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-rounded">
        <div className="flex justify-end h-2 p-2 mt-12 dark:text-white">
          <button
            onClick={onToggle}
            className="rounded-full p-2 focus:outline-none mt-3"
            aria-label="Toggle Sidebar"
          >
            <FiMenu size={27} className={activeInterface === 'ABL' ? 'text-[#9abba6]' : ''} />
          </button>
        </div>
        <div className="mt-2 ml-4 flex-1">
          <SidebarMenu
            isCollapsed={isCollapsed}
            searchQuery={searchQuery}
            activeInterface={activeInterface}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;