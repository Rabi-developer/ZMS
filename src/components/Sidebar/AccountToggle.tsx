import React from "react";
import { HiSquare3Stack3D } from "react-icons/hi2";

const AccountToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div className="mb-5 mt-2 ml-4 pb-4 border-stone-300 h-6 dark:text-white">
      <button className="flex p-0.5  rounded transition-colors relative gap-2 w-full items-center">
        <HiSquare3Stack3D size={40} className="text-[#06b6d4] dark:text-[#387fbf]" />
        {!isCollapsed && (
          <div className="text-start text-3xl ">
            IMS
          </div>
        )}
      </button>
    </div>
  );
};

export default AccountToggle;
