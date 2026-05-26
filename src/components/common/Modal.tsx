"use client";

import { useOutsideClick } from "@/hooks/useOutsideClick";
import {
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { HiXMark } from "react-icons/hi2";

interface ModalContextType {
  openName: string;
  close: () => void;
  open: (name: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProps {
  children: ReactNode;
}

function Modal({ children }: ModalProps) {
  const [openName, setOpenName] = useState("");

  const close = () => setOpenName("");
  const open = setOpenName;

  return (
    <ModalContext.Provider value={{ openName, close, open }}>
      {children}
    </ModalContext.Provider>
  );
}

interface OpenProps {
  children: ReactElement;
  opens: string;
}

function Open({ children, opens: opensWindowName }: OpenProps) {
  const typedChildren = children as ReactElement<any>;
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("Modal.Open must be used within a Modal");
  }

  const { open } = context;
  return cloneElement(typedChildren, { onClick: () => open(opensWindowName) });
}

interface WindowProps {
  children: ReactElement<{ onCloseModal?: () => void }>;
  name: string;
}

function Window({ children, name }: WindowProps) {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("Modal.Window must be used within a Modal");
  }

  const { openName, close } = context;
  const ref = useOutsideClick(close);

  if (name !== openName) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-screen bg-white/30 backdrop-blur-md z-50 transition-all duration-500">
      <div
        ref={ref}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg md:rounded-xl shadow-2xl p-4 transition-all duration-500 border border-gray-100 max-w-sm md:max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 z-10"
        >
          <HiXMark className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>

        <div className="pt-8 md:pt-4">
          {cloneElement(children, { onCloseModal: close } as any)}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Add types to the Modal component
interface Modal extends React.FC<ModalProps> {
  Open: React.FC<OpenProps>;
  Window: React.FC<WindowProps>;
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;

/**
 * Controlled modal shell — use when modal visibility is driven by component
 * state (e.g. selecting which row to delete) rather than the named
 * Modal.Open / Modal.Window pattern.
 */
interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const SIZE_MAP: Record<NonNullable<ModalShellProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function ModalShell({
  isOpen,
  onClose,
  children,
  size = "md",
  showCloseButton = true,
}: ModalShellProps) {
  const ref = useOutsideClick(onClose);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-screen bg-white/30 backdrop-blur-md z-50 transition-all duration-500">
      <div
        ref={ref}
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg md:rounded-xl shadow-2xl p-4 transition-all duration-500 border border-gray-100 ${SIZE_MAP[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 z-10"
            aria-label="Close"
          >
            <HiXMark className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        )}
        <div className={showCloseButton ? "pt-8 md:pt-4" : ""}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
