'use client';
import { useState } from "react";
import { FaAngleRight } from "react-icons/fa";
import { sideBarItems } from "../lib/StaticData/sideBarItems";
import NavLink from "../ui/NavLink"; 

type SubMenuItem = {
  text: string;
  type?: "heading" | "link"; 
  href?: string; 
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};

type SidebarItem = {
  text: string;
  type?: "heading" | "link"; 
  href?: string; 
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};


const SideBarMain = ({ setSideBarToggle, sideBarToggle }: { setSideBarToggle: React.Dispatch<React.SetStateAction<boolean>>; sideBarToggle: boolean }) => {
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const handleSubMenuToggle = (text: string) => {
    setOpenSubMenu(openSubMenu === text ? null : text);
  };

  const generateSidebarItems = () => {
    return sideBarItems.map((item, index) => (
      <li key={index} className="relative">
        <div onClick={() => item.sub_menu && handleSubMenuToggle(item.text)}>
          <NavLink
            href={item.type || "#"}
            className={ `hover:bg-[#465869]  hover:text-white border-[#33a4d8] hover:border-s-4 duration-200 transition-all flex items-center gap-2 px-3 py-3 ${sideBarToggle ? 'flex flex-row-reverse justify-between' : ''}`}
          >
            <span className={sideBarToggle ? 'ml-auto' : ''}>
              {item.icon && <item.icon color={item.color} size={20} />}
            </span>
            <span className={`${sideBarToggle ? 'hidden' : 'inline-block text-white'} transition-all delay-100`}>
              {item.text}
            </span>
            {item.sub_menu && (
              <FaAngleRight className={`ml-auto text-white ${openSubMenu === item.text ? 'rotate-90' : ''}`} />
            )}
          </NavLink>
        </div>
        {item.sub_menu && openSubMenu === item.text && (
          <ul className={`${sideBarToggle ? 'pl-4' : 'pl-6'}`}>
            {item.sub_menu.map((subItem, subIndex) => (
              <li key={subIndex}>
                <NavLink
                  href={subItem.href}
                  className="hover:bg-[#465869] hover:text-white hover:border-s-4 duration-200 transition-all flex items-center gap-2 pl-1 py-2 border-[#33a4d8]"
                >
                  <span>
                    {subItem.icon && <subItem.icon color={subItem.color} size={16} />}
                  </span>
                  <span className={`${sideBarToggle ? 'hidden' : 'inline-block text-white'}`}>
                    {subItem.text}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <aside className={`fixed top-[68px] bottom-[58px] left-0 bg-gray-800 z-10 ${sideBarToggle ? 'w-[60px]' : 'w-[220px]'} transition-all duration-200`}>
      <div className="flex justify-end items-center border-b p-2">
        <div onClick={() => setSideBarToggle(!sideBarToggle)} className="cursor-pointer">
          <FaAngleRight className={`text-gray-200 transition-transform duration-200 ml-auto mr-2 ${sideBarToggle ? 'rotate-180' : ''}`} size={20} />
        </div>
      </div>
      <ul className="pb-6 overflow-y-auto h-[93.5%] custom-scrollbar">
        {generateSidebarItems()}
      </ul>
    </aside>
  );
};

export default SideBarMain;
