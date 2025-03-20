import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ClickOutside from "@/components/Header/ClickOutside";
import { useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { toast } from "react-toastify";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName);
  }, []);

  const logOut = () => {
    localStorage.clear(); // Ensure the token is removed
    router.push("/signin");
    toast("Logged out Successfully", { type: "success" });
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      {/* User's name display */}
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4 cursor-pointer"
        href="#"
      >
        {userName ? (
          <span
            className="text-white text-lg font-bold py-2 px-4 bg-black dark:bg-[#4c7bc4] rounded-full cursor-pointer hover:bg-[#3a3b3f] dark:hover:bg-[#5f95d2] transition duration-300"
          >
            {userName}
          </span>
        ) : (
          <span className="text-sm font-medium text-white dark:text-white">
            Guest
          </span>
        )}
      </Link>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          className="absolute right-0 mt-[10px] flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
        >
          

          <button
            type="button"
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            onClick={logOut}
          >
            <LuLogOut color="#656565" />
            {userName ? "Log Out" : "Login / Sign Up"}
          </button>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;
