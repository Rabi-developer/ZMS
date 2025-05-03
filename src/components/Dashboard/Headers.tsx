'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMenu, FiGrid, FiPackage } from 'react-icons/fi';
import { GiMoneyStack } from 'react-icons/gi';
import DarkMode from '@/components/DarkMood/DarkMode';
import AccountToggle from '../Sidebar/AccountToggle';
import Link from 'next/link';
import DropdownUser from '@/components/Header/DropdownUser';
import { motion, AnimatePresence } from 'framer-motion';

const Headers = ({
  toggleSidebar,
  setSearchQuery,
}: {
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
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
    <div className="fixed top-0 left-0 w-full z-50 py-3 px-4 md:px-6 bg-white dark:bg-[#030630] dark:text-white flex items-center justify-between shadow-sm h-16">
      <div className="flex items-center gap-4">
        {/* <button onClick={toggleSidebar} className="text-gray-700 dark:text-white">
          <FiMenu size={24} />
        </button> */}
        <div className="hidden md:block">
          <AccountToggle isCollapsed={false} />
        </div>
      </div>

      <div className="flex-grow max-w-xs sm:max-w-md md:max-w-lg mx-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#33a4d8]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <motion.button
            ref={buttonRef}
            className="relative group bg-gradient-to-r from-[#33a4d8] to-[#0891b2] p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
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
                className="absolute right-0 mt-2 w-56 bg-[#e4f1fa] dark:bg-[#030630]/40 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Link href="/items" onClick={() => setIsDropdownOpen(false)}>
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white rounded-t-lg transition-all duration-200">
                    <FiPackage className="text-lg" />
                    <span>Add All Items</span>
                  </div>
                </Link>
                <Link href="/valuemanagement" onClick={() => setIsDropdownOpen(false)}>
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white rounded-b-lg transition-all duration-200">
                    <GiMoneyStack className="text-lg" />
                    <span>Value Management</span>
                  </div>
                </Link>
                <Link href="/gst" onClick={() => setIsDropdownOpen(false)}>
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white rounded-b-lg transition-all duration-200">
                    <GiMoneyStack className="text-lg" />
                    <span>General Sale Text Type</span>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <DarkMode />
        {userName ? (
          <DropdownUser />
        ) : (
          <Link
            href="/signin"
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-full px-4 py-2 text-sm"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default Headers;