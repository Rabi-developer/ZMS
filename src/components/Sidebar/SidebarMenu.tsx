'use client';
import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiChevronRight } from 'react-icons/fi';
import { sideBarItems } from '@/components/lib/StaticData/sideBarItems';
import { ablSideBarItems } from '@/components/lib/StaticData/ablSideBarItems';
import Link from 'next/link';

type SubMenuItem = {
  text: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};

type SidebarItem = {
  text: string;
  type: 'heading' | 'link';
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  sub_menu?: SubMenuItem[];
};

const SidebarMenu: React.FC<{
  isCollapsed: boolean;
  searchQuery: string;
  activeInterface: 'ZMS' | 'ABL';
}> = ({ isCollapsed, searchQuery, activeInterface }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ text: string; top: number } | null>(null);
  const [hoveredSubItem, setHoveredSubItem] = useState<
    { text: string; top: number; left: number } | null
  >(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const menuItemRefs = React.useRef<{ [key: string]: HTMLLIElement | null }>({});
  const subMenuItemRefs = React.useRef<{ [key: string]: HTMLLIElement | null }>({});

  useEffect(() => {
    if (isCollapsed) {
      setActiveMenu(null);
      setActiveSubMenu(null);
      setHoveredItem(null);
      setHoveredSubItem(null);
    }
  }, [isCollapsed]);

  const toggleMenu = (menuText: string) => {
    if (isCollapsed) return;
    setActiveMenu(activeMenu === menuText ? null : menuText);
    setActiveSubMenu(null);
  };

  const toggleSubMenu = (subMenuText: string) => {
    setActiveSubMenu(activeSubMenu === subMenuText ? null : subMenuText);
  };

  const handleMouseEnter = (itemText: string) => {
    if (!isCollapsed) return;

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const ref = menuItemRefs.current[itemText];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setHoverTimeout(
        setTimeout(() => {
          setHoveredItem({ text: itemText, top: rect.top });
        }, 200)
      );
    }
  };

  const handleSubMenuMouseEnter = (subItemText: string) => {
    if (!isCollapsed) return;

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const ref = subMenuItemRefs.current[subItemText];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setHoverTimeout(
        setTimeout(() => {
          setHoveredSubItem({ text: subItemText, top: rect.top, left: rect.right });
        }, 200)
      );
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setHoverTimeout(
      setTimeout(() => {
        setHoveredItem(null);
        setHoveredSubItem(null);
      }, 200)
    );
  };

  const items = activeInterface === 'ZMS' ? sideBarItems : ablSideBarItems;

  const filteredItems = (items as SidebarItem[]).filter((item: SidebarItem) => {
    if (searchQuery === '') return true;
    const matchesText = item.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubMenu = item.sub_menu?.some((subItem: SubMenuItem) =>
      subItem.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subItem.sub_menu &&
        subItem.sub_menu.some((subSubItem: SubMenuItem) =>
          subSubItem.text.toLowerCase().includes(searchQuery.toLowerCase())
        ))
    );
    return matchesText || !!matchesSubMenu;
  });

  const renderSubMenu = (subMenu: SubMenuItem[] | undefined, parentPosition = '', level = 1) => {
    if (!subMenu) return null;

    const filteredSubMenu = subMenu.filter(
      (subItem: SubMenuItem) =>
        searchQuery === '' ||
        subItem.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subItem.sub_menu &&
          subItem.sub_menu.some((subSubItem: SubMenuItem) =>
            subSubItem.text.toLowerCase().includes(searchQuery.toLowerCase())
          ))
    );

    if (filteredSubMenu.length === 0 && searchQuery) return null;

    if (isCollapsed && level === 1 && hoveredItem?.text === parentPosition) {
      return (
        <div
          className={`fixed left-20 ml-1 py-2 rounded-lg shadow-xl z-50 ${
            activeInterface === 'ABL'
              ? 'bg-[#1a5f3a] dark:bg-[#2a7f4a]'
              : 'bg-[#06b6d4] dark:bg-[#215083]'
          }`}
          style={{ top: `${hoveredItem.top}px` }}
          onMouseEnter={() => handleMouseEnter(parentPosition)}
          onMouseLeave={handleMouseLeave}
        >
          <ul className="space-y-1">
            {filteredSubMenu.map((subItem: SubMenuItem, subIndex: number) => (
              <li
                key={subIndex}
                ref={(el) => {
                  subMenuItemRefs.current[subItem.text] = el;
                }}
                onMouseEnter={() => subItem.sub_menu && handleSubMenuMouseEnter(subItem.text)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  onClick={() => subItem.sub_menu && toggleSubMenu(subItem.text)}
                  className={`flex items-center px-4 py-2.5 cursor-pointer rounded-lg transition-all duration-300 mx-1
                    ${
                      activeSubMenu === subItem.text
                        ? activeInterface === 'ABL'
                          ? 'bg-[#e6f0e8] text-[#1a5f3a] dark:bg-[#3a9f5a] dark:text-white'
                          : 'bg-cyan-50 text-[#06b6d4] dark:bg-[#387fbf] dark:text-[#e2ecf7]'
                        : activeInterface === 'ABL'
                        ? 'text-white hover:bg-[#e6f0e8] hover:text-[#d4a017] dark:hover:bg-[#3a9f5a] dark:hover:text-white'
                        : 'text-white hover:bg-cyan-50 hover:text-[#06b6d4] dark:hover:bg-[#387fbf] dark:hover:text-[#e2ecf7]'
                    }`}
                >
                  {subItem.icon && (
                    <subItem.icon
                      className={`w-5 h-5 mr-3 ${
                        activeInterface === 'ABL'
                          ? 'text-white hover:text-[#d4a017] dark:text-white dark:hover:text-[#d4a017]'
                          : 'text-white dark:text-[#e2ecf7]'
                      }`}
                    />
                  )}
                  <Link href={subItem.href || '#'} className="flex-grow">
                    {subItem.text}
                  </Link>
                  {subItem.sub_menu && (
                    <span className="ml-2">
                      <FiChevronRight
                        size={16}
                        className={`${
                          activeInterface === 'ABL'
                            ? 'text-white hover:text-[#d4a017] dark:text-white dark:hover:text-[#d4a017]'
                            : 'text-white dark:text-[#e2ecf7]'
                        }`}
                      />
                    </span>
                  )}
                </div>
                {isCollapsed &&
                  subItem.sub_menu &&
                  hoveredSubItem?.text === subItem.text &&
                  renderSubMenu(subItem.sub_menu, subItem.text, level + 1)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (isCollapsed && level > 1 && hoveredSubItem?.text === parentPosition) {
      return (
        <div
          className={`fixed min-w-[180px] py-2 rounded-lg shadow-xl z-50 ${
            activeInterface === 'ABL'
              ? 'bg-[#1a5f3a] dark:bg-[#2a7f4a]'
              : 'bg-[#06b6d4] dark:bg-[#215083]'
          }`}
          style={{ top: `${hoveredSubItem.top}px`, left: `${hoveredSubItem.left + 10}px` }}
          onMouseEnter={() => handleSubMenuMouseEnter(parentPosition)}
          onMouseLeave={handleMouseLeave}
        >
          <ul className="space-y-1">
            {filteredSubMenu.map((subItem: SubMenuItem, subIndex: number) => (
              <li
                key={subIndex}
                ref={(el) => {
                  subMenuItemRefs.current[subItem.text] = el;
                }}
                onMouseEnter={() => subItem.sub_menu && handleSubMenuMouseEnter(subItem.text)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  onClick={() => subItem.sub_menu && toggleSubMenu(subItem.text)}
                  className={`flex items-center px-4 py-2.5 cursor-pointer rounded-lg transition-all duration-300 mx-1
                    ${
                      activeSubMenu === subItem.text
                        ? activeInterface === 'ABL'
                          ? 'bg-[#e6f0e8] text-[#1a5f3a] dark:bg-[#3a9f5a] dark:text-white'
                          : 'bg-cyan-50 text-[#06b6d4] dark:bg-[#387fbf] dark:text-[#e2ecf7]'
                        : activeInterface === 'ABL'
                        ? 'text-white hover:bg-[#e6f0e8] hover:text-[#d4a017] dark:hover:bg-[#3a9f5a] dark:hover:text-white'
                        : 'text-white hover:bg-cyan-50 hover:text-[#06b6d4] dark:hover:bg-[#387fbf] dark:hover:text-[#e2ecf7]'
                    }`}
                >
                  {subItem.icon && (
                    <subItem.icon
                      className={`w-5 h-5 mr-3 ${
                        activeInterface === 'ABL'
                          ? 'text-white hover:text-[#d4a017] dark:text-white dark:hover:text-[#d4a017]'
                          : 'text-white dark:text-[#e2ecf7]'
                      }`}
                    />
                  )}
                  <Link href={subItem.href || '#'} className="flex-grow">
                    {subItem.text}
                  </Link>
                  {subItem.sub_menu && (
                    <span className="ml-2">
                      <FiChevronRight
                        size={16}
                        className={`${
                          activeInterface === 'ABL'
                            ? 'text-white hover:text-[#d4a017] dark:text-white dark:hover:text-[#d4a017]'
                            : 'text-white dark:text-[#e2ecf7]'
                        }`}
                      />
                    </span>
                  )}
                </div>
                {isCollapsed &&
                  subItem.sub_menu &&
                  hoveredSubItem?.text === subItem.text &&
                  renderSubMenu(subItem.sub_menu, subItem.text, level + 1)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <ul className={`ml-${level * 4} mt-1 space-y-1 transition-all duration-300`}>
        {filteredSubMenu.map((subItem: SubMenuItem, subIndex: number) => (
          <li
            key={subIndex}
            className="mb-2"
            ref={(el) => {
              subMenuItemRefs.current[subItem.text] = el;
            }}
          >
            <div
              onClick={() => subItem.sub_menu && toggleSubMenu(subItem.text)}
              className={`flex items-center px-5 py-3 cursor-pointer rounded-lg transition-all duration-300
                ${
                  activeSubMenu === subItem.text
                    ? activeInterface === 'ABL'
                      ? 'bg-[#1a5f3a] dark:bg-[#2a7f4a] text-white'
                      : 'bg-[#06b6d4] dark:bg-[#215083] text-white'
                    : activeInterface === 'ABL'
                    ? 'text-white hover:bg-[#3a9f5a] hover:text-[#d4a017] dark:text-white dark:hover:bg-[#3a9f5a] dark:hover:text-[#d4a017]'
                    : 'dark:text-white hover:bg-cyan-50 hover:text-[#06b6d4] dark:hover:bg-[#387fbf] dark:hover:text-[#e2ecf7]'
                }`}
            >
              {subItem.icon && (
                <subItem.icon
                  className={`w-5 h-5 mr-2 ${
                    activeInterface === 'ABL'
                      ? 'text-white hover:text-[#d4a017] dark:text-white dark:hover:text-[#d4a017]'
                      : 'dark:text-white'
                  }`}
                />
              )}
              <Link href={subItem.href || '#'} className="flex-grow">
                {subItem.text}
              </Link>
              {subItem.sub_menu && (
                <span className="ml-auto text-lg">
                  {activeSubMenu === subItem.text ? (
                    <FiChevronUp className="dark:text-white" />
                  ) : (
                    <FiChevronDown className="dark:text-white" />
                  )}
                </span>
              )}
            </div>
            {!isCollapsed &&
              subItem.sub_menu &&
              activeSubMenu === subItem.text &&
              renderSubMenu(subItem.sub_menu, subItem.text, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`${isCollapsed ? '' : 'px-3'} py-4`}>
      <ul className="space-y-1 h-full">
        {filteredItems.length > 0 ? (
          filteredItems.map((item: SidebarItem, index: number) => (
            <li
              key={index}
              ref={(el) => {
                menuItemRefs.current[item.text] = el;
              }}
              onMouseEnter={() => isCollapsed && handleMouseEnter(item.text)}
              onMouseLeave={handleMouseLeave}
              className="mb-2 dark:text-white"
            >
              {item.type === 'heading' ? (
                !isCollapsed && (
                  <div className="px-4 text-xs mt-5 text-[#9ca3af] dark:text-white uppercase font-semibold">
                    {item.text}
                  </div>
                )
              ) : (
                <div
                  className={`relative flex items-center px-5 py-3 cursor-pointer rounded-lg transition-all duration-300
                    ${
                      activeMenu === item.text
                        ? activeInterface === 'ABL'
                          ? 'bg-[#1a5f3a] dark:bg-[#2a7f4a] text-white shadow-lg'
                          : 'bg-[#06b6d4] dark:bg-[#215083] text-white shadow-lg'
                        : activeInterface === 'ABL'
                        ? 'text-white dark:text-white hover:bg-[#e6f0e8] hover:text-[#d4a017] dark:hover:bg-[#3a9f5a] dark:hover:text-[#d4a017]'
                        : 'dark:text-white hover:bg-[cyan-50] hover:text-[#06b6d4] dark:hover:bg-[#4b75c5] dark:hover:text-[#e2ecf7]'
                    }`}
                  onClick={() => (item.sub_menu ? toggleMenu(item.text) : null)}
                >
                  {item.icon && (
                    <span className={`${isCollapsed ? 'mx-auto' : 'mr-2'}`}>
                      <item.icon
                        className={`w-5 h-5 ${
                          activeInterface === 'ABL'
                            ? 'text-white dark:text-white hover:text-[#d4a017] dark:hover:text-[#d4a017]'
                            : 'dark:text-white'
                        }`}
                      />
                    </span>
                  )}
                  {!isCollapsed && (
                    <>
                      <Link href={item.href || '#'} className="flex-grow">
                        {item.text}
                      </Link>
                      {item.sub_menu && (
                        <span className="ml-auto text-lg">
                          {activeMenu === item.text ? (
                            <FiChevronUp className="dark:text-white" />
                          ) : (
                            <FiChevronDown className="dark:text-white" />
                          )}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.sub_menu && (
                    <span className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <FiChevronRight
                        size={14}
                        className={`${
                          activeInterface === 'ABL'
                            ? 'text-white dark:text-white hover:text-[#d4a017] dark:hover:text-[#d4a017]'
                            : 'dark:text-white'
                        }`}
                      />
                    </span>
                  )}
                </div>
              )}
              {!isCollapsed &&
                item.sub_menu &&
                activeMenu === item.text &&
                renderSubMenu(item.sub_menu, item.text)}
              {isCollapsed &&
                hoveredItem?.text === item.text &&
                item.sub_menu &&
                renderSubMenu(item.sub_menu, item.text)}
            </li>
          ))
        ) : (
          <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
            No matching items found
          </li>
        )}
      </ul>
    </div>
  );
};

export default SidebarMenu;