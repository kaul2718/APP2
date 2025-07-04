
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export const useSidebarNavigation = (navItems: NavItem[]) => {
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpen) =>
      prevOpen?.type === menuType && prevOpen.index === index
        ? null
        : { type: menuType, index }
    );
  };

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  useEffect(() => {
    // Autoexpand submenu if path is matched
    let matched = false;
    ["main", "others"].forEach((menuType) => {
      navItems.forEach((nav, index) => {
        nav.subItems?.forEach((sub) => {
          if (isActive(sub.path)) {
            setOpenSubmenu({ type: menuType as "main" | "others", index });
            matched = true;
          }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [pathname, navItems, isActive]);

  return {
    openSubmenu,
    subMenuHeight,
    subMenuRefs,
    handleSubmenuToggle,
    isActive,
  };
};
