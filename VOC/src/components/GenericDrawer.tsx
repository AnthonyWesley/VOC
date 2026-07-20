import { createContext, useState } from "react";
import clsx from "clsx";

export const DrawerContext = createContext({ open: true });

type GenericDrawerProps = {
  children: React.ReactNode;
  position?: "left" | "right";
  defaultOpen?: boolean;
  expandedWidth?: number;
  collapsedWidth?: number;
  togglePosition?: "top" | "bottom";
  collapseBehavior?: "icons" | "hidden";
  scrollable?: boolean;
  mobileBreakpoint?: string;
};

export default function GenericDrawer({
  children,
  position = "left",
  defaultOpen = true,
  expandedWidth = 240,
  collapsedWidth = 60,
  togglePosition = "bottom",
  collapseBehavior = "icons",
  scrollable = false,
}: GenericDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeft = position === "left";

  return (
    <>
      {/* Desktop */}
      <DrawerContext.Provider value={{ open }}>
        <aside
          className="hidden transition-all duration-300 lg:sticky lg:top-0 lg:flex lg:h-full lg:self-start"
          style={{
            width: open ? expandedWidth : collapsedWidth,
          }}
        >
          <div className="relative flex h-full w-full flex-col rounded-xl">
            <button
              className={`absolute z-50 ${togglePosition === "top" ? "top-4" : "bottom-40"} ${isLeft ? "left-6" : "right-6"} `}
              onClick={() => setOpen(!open)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={clsx("h-8 w-8 transition-transform", {
                  "rotate-180": open && isLeft,
                  "scale-y-[-1] rotate-180": open && !isLeft,
                })}
              >
                <path d="M15 18L9 12L15 6" />
              </svg>
            </button>

            <div
              className={clsx("h-full transition-all duration-300", {
                "px-3 py-4": open,
                "px-1 py-4": !open && collapseBehavior === "icons",
                "overflow-y-auto": scrollable && open,
                "pointer-events-none overflow-hidden opacity-0":
                  !open && collapseBehavior === "hidden",
              })}
            >
              {children}
            </div>
          </div>
        </aside>
      </DrawerContext.Provider>

      {/* Mobile Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={clsx(
          "btn btn-circle fixed bottom-5 z-50 lg:hidden",
          isLeft ? "left-4" : "right-4",
        )}
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-[999] lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />

        <aside
          className={clsx(
            "absolute top-0 h-full w-72 bg-[var(--bg-mid)] shadow-xl transition-transform",
            isLeft ? "left-0" : "right-0",
          )}
        >
          <DrawerContext.Provider value={{ open: true }}>
            <div className="flex h-full flex-col p-4">
              <button
                type="button"
                className="btn btn-sm self-end"
                onClick={() => setMobileOpen(false)}
              >
                ✕
              </button>

              {children}
            </div>
          </DrawerContext.Provider>
        </aside>
      </div>
    </>
  );
}
