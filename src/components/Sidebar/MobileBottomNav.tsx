'use client';
import React from 'react';
import { FiMenu, FiHome, FiSettings } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface MobileBottomNavProps {
  onToggleSidebar: () => void;
  activeInterface: 'ZMS' | 'ABL';
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onToggleSidebar, activeInterface }) => {
  const router = useRouter();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSidebar();
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className={`flex items-center justify-around py-3 px-4 border-t backdrop-blur-sm ${
        activeInterface === 'ABL' 
          ? 'bg-[#1a2a22]/95 border-[#2a3a32]' 
          : 'bg-white/95 dark:bg-[#030630]/95 border-gray-200 dark:border-gray-700'
      }`}>
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeInterface === 'ABL' 
              ? 'text-[#9abba6] hover:bg-[#2a3a32]' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FiHome size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button
          onClick={handleMenuClick}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeInterface === 'ABL' 
              ? 'text-[#9abba6] hover:bg-[#2a3a32]' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FiMenu size={20} />
          <span className="text-xs mt-1">Menu</span>
        </button>
        
        <button
          onClick={() => router.push('/settings')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            activeInterface === 'ABL' 
              ? 'text-[#9abba6] hover:bg-[#2a3a32]' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FiSettings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
