import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/Header/ClickOutside";
import { useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { toast } from "react-toastify";

const DropdownUser = ({ activeInterface }: { activeInterface: 'ZMS' | 'ABL' }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName);
  }, []);

  const logOut = () => {
    localStorage.clear(); 
    router.push("/signin");
    toast("Logged out Successfully", { type: "success" });
  };
  const buttonClass = activeInterface === 'ABL'
    ? 'bg-[#6e997f] focus:ring-[#6e997f] dark:focus:ring-[#d4a017]'
    : 'bg-gradient-to-r from-[#33a4d8] to-[#0891b2] text-white hover:bg-gradient-to-r hover:from-[#0891b2] hover:to-[#33a4d8]';
  const dropdownClass = activeInterface === 'ABL' 
    ? 'bg-[#e6f0e8]  hover-bg-[#9abba6] dark:bg-[#1a2a22]/90 border-[#d4a017]'
    : 'bg-[#e4f1fa] dark:bg-[#030630]/40 border-gray-200 dark:border-gray-700';
  const iconColor = activeInterface === 'ABL' ? '#d4a017' : '#656565';
  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-4 cursor-pointer ${buttonClass} rounded py-2 px-4 font-bold transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105`}
        href="#"
      >
        {userName ? userName : 'Guest'}
      </Link>
      {dropdownOpen && (
        <div className={`absolute right-0 mt-[10px] flex w-62.5 flex-col rounded-sm ${dropdownClass} shadow-default`}>
          <button
            type="button"
            className={`flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out ${
              activeInterface === 'ABL'
                ? 'bg-[#6e997f] focus:ring-[#6e997f] dark:focus:ring-[#d4a017]'
                : 'hover:bg-gradient-to-r hover:from-[#33a4d8] hover:to-[#0891b2] hover:text-white'
            }`}
            onClick={logOut}
          >
            <LuLogOut color={iconColor} />
            {userName ? 'Log Out' : 'Login / Sign Up'}
          </button>
        </div>
      )}
    </ClickOutside>
  );
};
export default DropdownUser;