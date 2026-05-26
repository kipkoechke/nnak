"use client";

import { MdBlock } from "react-icons/md";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <MdBlock className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>

        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    </div>
  );
}
