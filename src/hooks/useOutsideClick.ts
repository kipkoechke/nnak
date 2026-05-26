"use client";

import { useEffect, useRef } from "react";

interface UseOutsideClickOptions {
  listenCapturing?: boolean;
}

interface UseOutsideClickHandler {
  (): void;
}

export function useOutsideClick(
  handler: UseOutsideClickHandler,
  listenCapturing: UseOutsideClickOptions["listenCapturing"] = true
) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(
    function () {
      function handleClick(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          handler();
        }
      }

      document.addEventListener("click", handleClick, listenCapturing);

      return () =>
        document.removeEventListener("click", handleClick, listenCapturing);
    },
    [handler, listenCapturing]
  );

  return ref;
}
