import React, { useState, useEffect } from "react";
import { FiSearch, FiMenu } from "react-icons/fi";
import DarkMode from "@/components/DarkMood/DarkMode";
import AccountToggle from "../Sidebar/AccountToggle";
import Link from "next/link";
import DropdownUser from "@/components/Header/DropdownUser";

const Headers = ({
  toggleSidebar,
  setSearchQuery,
}: {
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
}) => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50 py-3 px-4 md:px-6 bg-white dark:bg-[#030630] dark:text-white flex items-center justify-between shadow-sm h-16">
      <div className="flex items-center gap-4">
       
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
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
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