'use client';
import React from 'react';

const AccountToggle = ({ isCollapsed, activeInterface }: { isCollapsed: boolean; activeInterface: 'ZMS' | 'ABL' }) => {
  return (
    <div className="mb-12 mt-4 ml-4 pb-4 border-stone-300 h-6 dark:text-white">
      <img
        src={activeInterface === 'ZMS' ? '/ZMS-Logo.png' : '/ABL-Logo.png'}
        className={`h-[8vh] w-24 ${isCollapsed ? 'hidden' : 'block'}`}
        alt={activeInterface === 'ZMS' ? 'ZMS Logo' : 'ABL Logo'}
      />
    </div>
  );
};

export default AccountToggle;