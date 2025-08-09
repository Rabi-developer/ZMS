'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiGrid, FiPackage } from 'react-icons/fi';
import { GiMoneyStack } from 'react-icons/gi';
import DarkMode from '@/components/DarkMood/DarkMode';
import DropdownUser from '@/components/Header/DropdownUser';
import AccountToggle from '@/components/Sidebar/AccountToggle';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const Headers = ({
  toggleSidebar,
  setSearchQuery,
  activeInterface,
  isCollapsed,
}: {
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  activeInterface: 'ZMS' | 'ABL';
  isCollapsed: boolean;
}) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    setUserName(storedUserName);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 py-3 px-4 md:px-6 flex items-center shadow-sm h-16 ${
        activeInterface === 'ABL'
          ? 'bg-[#1a2a22] dark:bg-[#1a2a22]'
          : 'bg-white dark:bg-[#030630]'
      } dark:text-white`}
    >
      <div>
         <AccountToggle isCollapsed={isCollapsed} activeInterface={activeInterface} />
      </div>
      <div className="flex items-center ml-[55vh] gap-4 max-w-7xl w-full justify-between">
        <div className="flex-grow">
          <div className="relative w-full max-w-lg">
            <FiSearch
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                activeInterface === 'ABL'
                  ? 'text-[#6e997f] dark:text-[#d4a017]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-full border ${
                activeInterface === 'ABL'
                  ? 'border-[#6e997f] focus:ring-[#6e997f] dark:focus:ring-[#d4a017]'
                  : 'border-gray-300 dark:border-gray-700 focus:ring-[#33a4d8]'
              } bg-transparent text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2`}
            />
          </div>
        </div>
        <div className="flex  gap-3 ">
       
          <div className="relative">
            <motion.button
              ref={buttonRef}
              className={`relative group p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 ${
                activeInterface === 'ABL'
                  ? 'bg-gradient-to-r from-[#1a5f3a] to-[#6e997f]'
                  : 'bg-gradient-to-r from-[#33a4d8] to-[#0891b2]'
              }`}
              onClick={toggleDropdown}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiGrid size={24} className="text-white" />
            </motion.button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  ref={dropdownRef}
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl border z-50 ${
                    activeInterface === 'ABL'
                      ? 'bg-[#e6f0e8] dark:bg-[#1a2a22]/90 border-[#d4a017]'
                      : 'bg-[#e4f1fa] dark:bg-[#030630]/40 border-gray-200 dark:border-gray-700'
                  } backdrop-blur-xl`}
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {activeInterface === 'ZMS' ? (
                    <>
                      <Link href="/items" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white rounded-t-lg transition-all duration-200`}
                        >
                          <FiPackage className="text-lg" />
                          <span>Add All Items</span>
                        </div>
                      </Link>
                      <Link href="/valuemanagement" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white transition-all duration-200`}
                        >
                          <GiMoneyStack className="text-lg" />
                          <span>Value Management</span>
                        </div>
                      </Link>
                      <Link href="/gst" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white rounded-b-lg transition-all duration-200`}
                        >
                          <GiMoneyStack className="text-lg" />
                          <span>General Sale Text Type</span>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/abl/vehicles" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#1a5f3a] hover:to-[#d4a017] hover:text-white rounded-t-lg transition-all duration-200`}
                        >
                          <FiPackage
                            className={`text-lg ${
                              activeInterface === 'ABL' ? 'dark:text-[#d4a017]' : ''
                            }`}
                          />
                          <span>Add Vehicle</span>
                        </div>
                      </Link>
                      <Link href="/abl/routes" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#1a5f3a] hover:to-[#d4a017] hover:text-white transition-all duration-200`}
                        >
                          <GiMoneyStack
                            className={`text-lg ${
                              activeInterface === 'ABL' ? 'dark:text-[#d4a017]' : ''
                            }`}
                          />
                          <span>Add Route</span>
                        </div>
                      </Link>
                      <Link href="/abl/invoices" onClick={() => setIsDropdownOpen(false)}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#1a5f3a] hover:to-[#d4a017] hover:text-white rounded-b-lg transition-all duration-200`}
                        >
                          <GiMoneyStack
                            className={`text-lg ${
                              activeInterface === 'ABL' ? 'dark:text-[#d4a017]' : ''
                            }`}
                          />
                          <span>Generate Invoice</span>
                        </div>
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <DarkMode />
          {userName ? (
           <DropdownUser activeInterface={activeInterface} />
          ) : (
            <Link
              href="/signin"
              className={`text-white font-medium rounded-full px-4 py-2 text-sm ${
                activeInterface === 'ABL'
                  ? 'bg-[#3a614c] hover:bg-[#d4a017] dark:hover:bg-[#d4a017]'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Headers;