import { ReactNode } from "react";
import Logo from "@/components/common/Logo";

export default function NnakPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary px-6 py-6 text-white text-center flex justify-center">
          <Logo />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
