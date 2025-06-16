import React from "react";
import { HiSquare3Stack3D } from "react-icons/hi2";

const AccountToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div className="mb-12  ml-4 pb-4 border-stone-300 h-6 dark:text-white">
   <img
      src="/ZMS-Logo.png"
      className={`h-[8vh] w-20 ${isCollapsed ? "hidden" : "block"}`} />
    </div>
  );
};

export default AccountToggle;
