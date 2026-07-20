import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 912): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    check(); // executa no mount
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
