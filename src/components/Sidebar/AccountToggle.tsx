'use client';
import React from 'react';

const AccountToggle = ({ isCollapsed, activeInterface }: { isCollapsed: boolean; activeInterface: 'ZMS' | 'ABL' }) => {
  return (
    <div className="mb-12 mt-4 ml-4 pb-4 border-stone-300 h-6 dark:text-white">
      <img
        src={activeInterface === 'ZMS' ? 'https://res.cloudinary.com/dxqvklctk/image/upload/v1755069630/ZMS-logo_nrn49l.png' : 'https://res.cloudinary.com/dxqvklctk/image/upload/v1757168762/ABL_Logo_1_yiiqgs.png'}
        className={`h-[7vh] w-27 ${isCollapsed ? 'hidden' : 'block'}`}
        alt={activeInterface === 'ZMS' ? 'ZMS Logo' : 'ABL Logo'}
      />
    </div>
  );
};

export default AccountToggle;