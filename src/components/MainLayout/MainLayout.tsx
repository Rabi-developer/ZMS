'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  Headers  from "@/components/Dashboard/Headers";
import Sidebar from "../Sidebar/Sidebar";
import { ToastContainer } from "react-toastify";

const MainLayout = ({ children }: any) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Toggle Sidebar Handler
  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if no token is found
      router.push("/signin");
    }
  }, []);

  return (
    <div className="h-screen flex overflow-y-scroll scrollbar-thin scrollbar-rounded">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarCollapsed ? "w-16" : "w-[320px]"
        } bg-white shadow-md h-full fixed left-0  top-0 transition-all duration-300
        dark:bg-[#030630] 
        `}>
          
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleSidebarToggle} />
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300  ${
          isSidebarCollapsed ? "ml-20" : "ml-[300px]"
        } flex-1 flex flex-col`}>
         <div
           className="z-50"
          >
          <ToastContainer />

          </div>
        <div className="sticky top-0 z-10 dark:bg-[#030630]">
          <Headers />
        </div>

      {/* Dashboard Content */}
      <div className="flex-1 pb-4   rounded  mr-6 ml-8 mt-20 mb-5 h-[150vh] ">
        {children}
        {/* overflow-y-auto */}
</div>

      </div>
    </div>
  );
};

export default MainLayout;
