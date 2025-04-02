'use client';
import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { sideBarItems } from "@/components/lib/StaticData/sideBarItems";
import NavLink from "../ui/NavLink"; 

type SubMenuItem = {
  text: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};

type sideBarItems = {
  text: string;
  type: "heading" | "link";
  link?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};

const SidebarMenu: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  const toggleMenu = (menuText: string) => {
    setActiveMenu(activeMenu === menuText ? null : menuText);
    setActiveSubMenu(null);
  };

  const toggleSubMenu = (subMenuText: string) => {
    setActiveSubMenu(activeSubMenu === subMenuText ? null : subMenuText);
  };

  const renderSubMenu = (subMenu: SubMenuItem[], level = 1) => {
    if (!subMenu) return null;

    return (
      <ul className={`ml-${level * 4} mt-1 transition-all duration-300`}>
        {subMenu.map((subItem, subIndex) => (
          <li key={subIndex} className="mb-2">
            <div
              onClick={() => subItem.sub_menu && toggleSubMenu(subItem.text)}
              className="flex items-center px-5 py-3 cursor-pointer rounded-lg transition-all duration-300
                        hover:bg-cyan-50 hover:text-[#06b6d4] dark:hover:bg-[#387fbf] dark:hover:text-[#e2ecf7]"
            >
              {subItem.icon && (
                <subItem.icon
                  className={`transition-transform duration-300 ${isCollapsed ? "mx-auto" : "mr-2"}`}
                />
              )}
              {!isCollapsed && (
                <a href={subItem.href} className="flex-grow">
                  <span className="ml-2">{subItem.text}</span>
                </a>
              )}
              {subItem.sub_menu && !isCollapsed && (
                <span className="ml-auto text-lg">
                  {activeSubMenu === subItem.text ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              )}
            </div>
            {subItem.sub_menu && activeSubMenu === subItem.text && renderSubMenu(subItem.sub_menu, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="ml-6">
      <ul className="h-full">
        {sideBarItems.map((item, index) => (
          <li key={index} className="mb-2">
            {item.type === "heading" ? (
              !isCollapsed && (
                <div className="px-4 text-xs mt-5 text-[#9ca3af] uppercase font-semibold">
                  {item.text}
                </div>
              )
            ) : (
              <div
                className={`flex items-center px-5 py-3 cursor-pointer rounded-lg transition-all duration-300
                  ${activeMenu === item.text 
                    ? "bg-[#06b6d4] dark:bg-[#215083] text-white shadow-lg" 
                    : "hover:bg-cyan-50 hover:text-[#06b6d4] dark:hover:bg-[#4b75c5] dark:hover:text-[#e2ecf7]"}`
                }
                onClick={() => (item.sub_menu ? toggleMenu(item.text) : null)}
              >
                {item.icon && (
                  <span className={`${isCollapsed ? "mx-auto" : "mr-2"}`}>
                    <item.icon />
                  </span>
                )}
                {!isCollapsed && (
                  <a href={item.href} className="flex-grow">
                    <span>{item.text}</span>
                  </a>
                )}
                {item.sub_menu && !isCollapsed && (
                  <span className="ml-auto text-lg">
                    {activeMenu === item.text ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                )}
              </div>
            )}
            {item.sub_menu && activeMenu === item.text && renderSubMenu(item.sub_menu)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarMenu;
