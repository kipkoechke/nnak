"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical } from "react-icons/fi";

// Types
interface MenuContextType {
  isOpen: boolean;
  coords: { x: number; y: number };
  openMenu: (coords: { x: number; y: number }) => void;
  closeMenu: () => void;
  menuId: string;
}

interface ActionMenuProps {
  children: ReactNode;
  menuId: string;
}

interface TriggerProps {
  children?: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface ContentProps {
  children: ReactNode;
  className?: string;
}

interface ItemProps {
  children: ReactNode;
  onClick?: () => void; // Simplified - no event parameter needed
  className?: string;
  disabled?: boolean;
}

// Context
const MenuContext = createContext<MenuContextType | null>(null);

const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be used within ActionMenu");
  }
  return context;
};

// Helper function to calculate position
const calculatePosition = (
  buttonElement: HTMLElement,
  dropdownHeight = 140,
): { x: number; y: number; position: "top" | "bottom" } => {
  const rect = buttonElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  // Show above if there's limited space below OR if we're in bottom half of viewport
  const isInBottomHalf = rect.bottom > viewportHeight * 0.8;
  const hasLimitedSpaceBelow = spaceBelow < dropdownHeight;
  const hasReasonableSpaceAbove = spaceAbove > 80;

  const position =
    (hasLimitedSpaceBelow || isInBottomHalf) && hasReasonableSpaceAbove
      ? "top"
      : "bottom";

  return {
    x: rect.right - 192,
    y: position === "top" ? rect.top - 100 : rect.bottom + 8,
    position,
  };
};

// Main ActionMenu Component
export const ActionMenu: React.FC<ActionMenuProps> & {
  Trigger: React.FC<TriggerProps>;
  Content: React.FC<ContentProps>;
  Item: React.FC<ItemProps>;
} = ({ children, menuId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const openMenu = (newCoords: { x: number; y: number }) => {
    setCoords(newCoords);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  const contextValue: MenuContextType = {
    isOpen,
    coords,
    openMenu,
    closeMenu,
    menuId,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </MenuContext.Provider>
  );
};

// Trigger Component
const Trigger: React.FC<TriggerProps> = ({
  children,
  className = "p-2 hover:bg-gray-100 rounded-full transition-colors",
  onClick,
}) => {
  const { isOpen, openMenu, closeMenu } = useMenuContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isOpen) {
      closeMenu();
    } else {
      const { x, y } = calculatePosition(e.currentTarget);
      openMenu({ x, y });
    }

    onClick?.(e);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children || <FiMoreVertical className="h-4 w-4 text-gray-600" />}
    </button>
  );
};

// Content Component
const Content: React.FC<ContentProps> = ({
  children,
  className = "fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]",
}) => {
  const { isOpen, coords } = useMenuContext();

  if (!isOpen) return null;

  return createPortal(
    <div
      className={className}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
    >
      <div className="py-1">{children}</div>
    </div>,
    document.body,
  );
};

// Item Component
const Item: React.FC<ItemProps> = ({
  children,
  onClick,
  className,
  disabled = false,
}) => {
  const { closeMenu } = useMenuContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled) {
      onClick?.();
      closeMenu();
    }
  };

  const baseClasses =
    "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const defaultTextColor = "text-gray-700";
  const finalClassName = className
    ? `${baseClasses} ${className}`
    : `${baseClasses} ${defaultTextColor}`;

  return (
    <button
      onClick={handleClick}
      className={finalClassName}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Attach compound components
ActionMenu.Trigger = Trigger;
ActionMenu.Content = Content;
ActionMenu.Item = Item;
