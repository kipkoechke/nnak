import Image from "next/image";
import { logoSrc } from "@/utils/logo";

const Logo = () => {
  return (
    <div className="h-8 md:h-12 w-auto shrink-0">
      <Image
        src={logoSrc}
        alt="National Police Service Logo"
        width={200}
        height={60}
        className="h-full w-auto object-contain"
        unoptimized
      />
    </div>
  );
};

export default Logo;
