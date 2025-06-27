'use client';
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/components/Dashboard/Headers";
import Sidebar from "../Sidebar/Sidebar";
import { ToastContainer } from "react-toastify";
import { ArrowUp, ArrowDown } from "lucide-react";

const MainLayout = ({ children }: any) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAtTop, setIsAtTop] = useState(true);
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  // Redirect to signin if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    }
  }, [router]);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setIsAtTop(scrollTop <= 10);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
      handleScroll();
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleScrollToggle = () => {
    if (!contentRef.current) {
      console.error("Content ref is not available");
      return;
    }

    const { scrollHeight, clientHeight } = contentRef.current;
    if (isAtTop) {
      contentRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    } else {
      contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen h-screen bg-[#f6f6f6] flex overflow-hidden scrollbar-thin scrollbar-rounded dark:bg-black">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-[#030630] z-30 transition-all duration-300  
          ${isSidebarCollapsed ? "md:w-[70px]" : "md:w-[310px]"}
          ${isSidebarOpen ? "w-[310px]" : "w-0"}
          md:w-auto
          scrollbar-custom`} // Added scrollbar-custom class
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
          ref={contentRef}
          className={`flex-1 pt-20 px-6 transition-all duration-300 overflow-y-auto scrollbar-thin scrollbar-rounded
            ${isSidebarCollapsed ? "md:ml-[70px]" : "md:ml-[320px]"}
            ml-0`}
        >
          <ToastContainer />
          {children}
        </div>
        {/* Scroll Toggle Button */}
        <button
          onClick={handleScrollToggle}
          className="fixed bottom-6 right-6 z-50 p-2 bg-gradient-to-r from-[#06b6d4] to-[#0899b2] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 "
           title={isAtTop ? "Scroll to bottom" : "Scroll to top"}
        >
          {isAtTop ? <ArrowDown className="h-6 w-6" /> : <ArrowUp className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
};

export default MainLayout;