"use client";
import { useState } from "react";
import Image from "next/image";
import { logoSrc, orgShortName } from "@/utils/logo";

const Logo = () => {
  // A logo that fails to load should read as the association's name, not as a
  // broken-image icon in the middle of the sign-in header.
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-lg font-bold tracking-wide text-white">
        {orgShortName}
      </span>
    );
  }

  return (
    <div className="h-8 md:h-12 w-auto shrink-0">
      <Image
        src={logoSrc}
        alt="NNAK Logo"
        width={200}
        height={60}
        className="h-full w-auto object-contain"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
};

export default Logo;
