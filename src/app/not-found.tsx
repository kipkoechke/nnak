import Link from "next/link";
import Image from "next/image";
import { logoSrc, appName } from "@/utils/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Image
            src={logoSrc}
            alt={appName}
            width={120}
            height={120}
            className="mx-auto mb-6"
          />
        </div>

        <div className="mb-4">
          <span className="text-8xl font-bold text-[#3460ab]">404</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#3460ab] text-white font-medium rounded-lg hover:bg-[#262364] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
