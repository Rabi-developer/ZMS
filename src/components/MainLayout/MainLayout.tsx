'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Headers from '@/components/Dashboard/Headers';
import Sidebar from '@/components/Sidebar/Sidebar';
import { ToastContainer } from 'react-toastify';
import { ArrowUp, ArrowDown } from 'lucide-react';

const MainLayout = ({ children, activeInterface }: { children: React.ReactNode; activeInterface: 'ZMS' | 'ABL' }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAtTop, setIsAtTop] = useState(true);
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signin');
    }
  }, [router]);

  // Add/remove abl-interface class to body based on active interface
  useEffect(() => {
    if (activeInterface === 'ABL') {
      document.body.classList.add('abl-interface');
    } else {
      document.body.classList.remove('abl-interface');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('abl-interface');
    };
  }, [activeInterface]);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setIsAtTop(scrollTop <= 10);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
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
      console.error('Content ref is not available');
      return;
    }

    const { scrollHeight, clientHeight } = contentRef.current;
    if (isAtTop) {
      contentRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    } else {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={`min-h-[100dvh] bg-[#f6f6f6] flex flex-col md:flex-row overflow-hidden dark:bg-black ${activeInterface === 'ABL' ? 'scrollbar-abl' : 'scrollbar-zms'}`}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      <div
        className={`fixed top-0 left-0 h-[100dvh] z-30 transition-all duration-300  
          ${isSidebarCollapsed ? 'md:w-[70px]' : 'md:w-[310px]'}
          ${isSidebarOpen ? 'w-[310px]' : 'w-0'}
          md:w-auto
          ${activeInterface === 'ABL' ? 'scrollbar-abl bg-white dark:bg-[#1a2a22]' : 'scrollbar-zms bg-white dark:bg-[#030630]'}`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          onMobileToggle={toggleMobileSidebar}
          searchQuery={searchQuery}
          activeInterface={activeInterface}
          isMobileOpen={isSidebarOpen}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        <div className="fixed top-0 left-0 w-full z-40">
          <Headers
            toggleSidebar={toggleMobileSidebar}
            setSearchQuery={setSearchQuery}
            activeInterface={activeInterface}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
        <div
          ref={contentRef}
          className={`flex-1 pt-28 px-6 transition-all duration-300 overflow-y-auto
            ${activeInterface === 'ABL' ? 'scrollbar-abl' : 'scrollbar-zms'}
            ${isSidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-[320px]'}
            ml-0 min-h-[calc(100dvh-7rem)] md:min-h-[100dvh]`}
        >
          <ToastContainer />
          {children}
        </div>
        <button
          onClick={handleScrollToggle}
          className={`fixed bottom-6 right-6 z-50 p-2 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 ${
            activeInterface === 'ABL'
              ? 'bg-gradient-to-r from-[#1a5f3a] to-[#d4a017]'
              : 'bg-gradient-to-r from-[#06b6d4] to-[#0899b2]'
          } text-white`}
          title={isAtTop ? 'Scroll to bottom' : 'Scroll to top'}
        >
          {isAtTop ? <ArrowDown className="h-6 w-6" /> : <ArrowUp className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
};

export default MainLayout;