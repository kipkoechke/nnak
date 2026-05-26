import { ImageLoaderProps } from "next/image";

export const laravelLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // Unescape any escaped slashes from JSON responses
  const cleanSrc = src.replace(/\\/g, "");
  return `${cleanSrc}?w=${width}&q=${quality || 75}`;
};
