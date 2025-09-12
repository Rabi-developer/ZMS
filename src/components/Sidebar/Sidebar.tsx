'use client';
import React from 'react';
import SidebarMenu from './SidebarMenu';
import { FiMenu, FiX } from 'react-icons/fi';

const Sidebar = ({
  isCollapsed,
  onToggle,
  searchQuery,
  activeInterface,
  onMobileToggle,
  isMobileOpen,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  searchQuery: string;
  activeInterface: 'ZMS' | 'ABL';
  onMobileToggle?: () => void;
  isMobileOpen?: boolean; 
}) => {
  return (
    <div
      className={`shadow-right-dark relative h-full transition-all duration-300 ${
        isCollapsed ? 'w-19' : 'w-[310px]'
      } ${activeInterface === 'ABL' ? 'bg-[#1a2a22] dark:bg-[#1a2a22]' : 'bg-white dark:bg-[#030630]'} 
      ${isMobileOpen ? 'block' : 'hidden md:block'}`} 
    >
      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-rounded">
       
        <div className="h-16"></div>

    
        <div className="flex-1 px-4">
          <SidebarMenu
            isCollapsed={isCollapsed}
            searchQuery={searchQuery}
            activeInterface={activeInterface}
          />
        </div>
   
        <div className="flex justify-center p-4 border-t border-opacity-20 border-gray-500 dark:border-gray-600">

          <button
            onClick={onToggle}
            className={`hidden md:flex group relative items-center justify-center w-10 h-10 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              activeInterface === 'ABL'
                ? 'bg-gradient-to-r from-[#1a5f3a] to-[#6e997f] hover:from-[#2a6f4a] hover:to-[#7ea98f] focus:ring-[#6e997f] text-white'
                : 'bg-gradient-to-r from-[#33a4d8] to-[#0891b2] hover:from-[#43b4e8] hover:to-[#18a1c2] focus:ring-[#33a4d8] text-white'
            } shadow-lg hover:shadow-xl`}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <div className="relative">
              {isCollapsed ? (
                <FiMenu
                  size={20}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
              ) : (
                <FiX
                  size={20}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
              )}
            </div>

            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                Expand Sidebar
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </button>

          {onMobileToggle && isMobileOpen && (
            <button
              onClick={onMobileToggle}
              className={`md:hidden group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                activeInterface === 'ABL'
                  ? 'bg-gradient-to-r from-[#1a5f3a] to-[#6e997f] hover:from-[#2a6f4a] hover:to-[#7ea98f] focus:ring-[#6e997f] text-white'
                  : 'bg-gradient-to-r from-[#33a4d8] to-[#0891b2] hover:from-[#43b4e8] hover:to-[#18a1c2] focus:ring-[#33a4d8] text-white'
              } shadow-lg hover:shadow-xl`}
              aria-label="Close Sidebar"
              title="Close Sidebar"
            >
              <FiX
                size={20}
                className="transition-transform duration-300 group-hover:rotate-180"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;