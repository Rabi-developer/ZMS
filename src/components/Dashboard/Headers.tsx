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
          <div className="relative">
            <button className="absolute left-0 top-1/2 -translate-y-1/2">
              <FiSearch className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary" />
            </button>
            <input
              type="text"
              placeholder="Type to search..."
              className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125"
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
