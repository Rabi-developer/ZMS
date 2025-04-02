import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import DarkMode from "@/components/DarkMood/DarkMode";
import AccountToggle from "../Sidebar/AccountToggle";
import Link from "next/link";
import DropdownUser from "@/components/Header/DropdownUser";

const Headers = ({ toggleSidebar, pathname }: any) => {
  // State to manage the user name from localStorage
  const [userName, setUserName] = useState<string | null>(null);

  // Fetch userName from localStorage on component mount
  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName);
  }, []);

  return (
    <div className="text-black fixed top-0 left-0 w-full z-10 py-1 flex justify-between items-center bg-white dark:bg-[#030630] dark:text-white">
      <div className="ml-5">
        <AccountToggle isCollapsed={false} />
      </div>

      <div className="flex-grow flex justify-center">
        <form action="https://formbold.com/s/unique_form_id" method="POST" className="w-full max-w-xl">
        <div className="relative border border-gray-300 dark:border-gray-700 h-12 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary">
  {/* Search Icon */}
  <button className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary">
    <FiSearch size={20} />
  </button>

  {/* Search Input */}
  <input
    type="text"
    placeholder="Type to search..."
    className="w-full h-full bg-transparent pl-10 pr-4 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:ring-0"
  />
</div>

        </form>
      </div>

      <div className="mr-5 flex items-center gap-4">
      <DarkMode />
        {/* User Actions */}
        {userName ? (
          <DropdownUser />
        ) : (
          <>
            {pathname !== "/signin" ? (
              <Link
                href="/signin"
                className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2 transition duration-300"
              >
                Login
              </Link>
            ) : (
              <Link
                href="/signup"
                className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2 transition duration-300"
              >
                Signup
              </Link>
            )}
          </>
        )}
       
      </div>
    </div>
  );
};

export default Headers;
