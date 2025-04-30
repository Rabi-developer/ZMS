'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/components/Dashboard/Headers";
import Sidebar from "../Sidebar/Sidebar";
import { ToastContainer } from "react-toastify";
import { FiMenu } from "react-icons/fi";

const MainLayout = ({ children }: any) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    }
  }, [router]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen h-screen bg-[#f6f6f6] flex overflow-y-scroll scrollbar-thin scrollbar-rounded dark:bg-black ">
      <div
      className={`fixed top-0 left-0 h-full bg-white dark:bg-[#030630] z-30 transition-all duration-300  
    ${isSidebarCollapsed ? "md:w-[70px]" : "md:w-[310px]"}
    ${isSidebarOpen ? "w-[310px]" : "w-0"}
    md:w-auto
  `}
     >

        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          searchQuery={searchQuery}
        />
      </div>

     

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <div className="fixed top-0 left-0 w-full z-40">
          <Headers
            toggleSidebar={toggleMobileSidebar}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <div
          className={`pt-20 px-6 transition-all duration-300
            ${isSidebarCollapsed ? "md:ml-[70px]" : "md:ml-[310px]"}
            ml-0`}
        >
          <ToastContainer />
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
