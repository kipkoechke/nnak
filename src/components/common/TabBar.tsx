import {
  createContext,
  useContext,
  useState,
  forwardRef,
  useCallback,
} from "react";

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onScroll?: () => void;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContext = createContext<{
  value: string;
  setValue: (v: string) => void;
  onValueChange?: (value: string) => void;
}>({ value: "", setValue: () => {} });

export function Tabs({
  defaultValue,
  value: controlledValue,
  children,
  className,
  onValueChange,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleSetValue = (newValue: string) => {
    // Only update internal state if not controlled
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider
      value={{ value, setValue: handleSetValue, onValueChange }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Updated TabsList with forwardRef
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, actions, onScroll }, ref) => {
    return (
      <div
        className={`flex bg-primary rounded-xl shadow p-1 sm:p-2 items-center w-full mb-2 sm:mb-4 overflow-x-auto scrollbar-hide ${
          className || ""
        }`}
        style={
          {
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitScrollbar: "none",
          } as React.CSSProperties
        }
        ref={ref}
        onScroll={onScroll}
      >
        <div className="flex gap-0.5 sm:gap-1 lg:gap-0 min-w-max">
          {children}
        </div>
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
      </div>
    );
  },
);

TabsList.displayName = "TabsList";

export function TabsTrigger({
  value,
  children,
  icon,
  className,
}: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;

  // Helper function to scroll tab into view
  const scrollTabIntoView = (
    button: HTMLButtonElement,
    behavior: ScrollBehavior = "smooth",
  ) => {
    const container = button.closest(".overflow-x-auto");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const peekOffset = 60;

      const buttonLeft =
        buttonRect.left - containerRect.left + container.scrollLeft;
      const targetScrollLeft =
        buttonLeft < peekOffset ? 0 : buttonLeft - peekOffset;

      container.scrollTo({
        left: targetScrollLeft,
        behavior,
      });
    }
  };

  // Callback ref - scrolls active tab into view on mount (for route-based navigation)
  const buttonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (node && active) {
        // Use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
          scrollTabIntoView(node, "instant");
        });
      }
    },
    [active],
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    ctx.setValue(value);

    // Scroll clicked tab into view with smooth animation
    const button = e.currentTarget;
    scrollTabIntoView(button, "smooth");
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={`flex items-center hover:cursor-pointer px-2 sm:px-3 lg:px-4 py-2 transition-all duration-300 text-xs sm:text-sm lg:text-sm relative outline-none whitespace-nowrap shrink-0 min-w-0 justify-center rounded-lg
        ${
          active
            ? "text-primary font-semibold bg-white shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }
        ${className || ""}
      `}
    >
      {icon && (
        <span
          className={`mr-1 sm:mr-1 lg:mr-2 ${
            active ? "text-primary" : "text-white/70"
          } shrink-0`}
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
