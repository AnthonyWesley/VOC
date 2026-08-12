import React from "react";
import clsx from "clsx";

type Direction = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface BalloonProps {
  children: React.ReactNode;
  direction?: Direction;
  align?: Align;
  offset?: number | string;
  className?: string;
}

export function Balloon({
  children,
  direction = "top",
  align = "start",
  offset = 10,
  className,
}: BalloonProps) {
  const base = "relative rounded-lg card-premium p-6 ";

  const arrowBase =
    "after:absolute after:h-0 after:w-0 after:border-transparent";

  const arrowDirection = {
    top: "after:border-b-[color:var(--card-top)] after:border-b-10 after:border-x-10 after:bottom-full",
    bottom:
      "after:border-t-[color:var(--card-top)] after:border-t-10 after:border-x-10 after:top-full",
    left: "after:border-r-[color:var(--card-top)] after:border-r-10 after:border-y-10 after:right-full",
    right:
      "after:border-l-[color:var(--card-top)] after:border-l-10 after:border-y-10 after:left-full",
  };

  const arrowAlign = {
    top: {
      start: "after:left-[var(--offset)]",
      center: "after:left-1/2 after:-translate-x-1/2",
      end: "after:right-[var(--offset)]",
    },
    bottom: {
      start: "after:left-[var(--offset)]",
      center: "after:left-1/2 after:-translate-x-1/2",
      end: "after:right-[var(--offset)]",
    },
    left: {
      start: "after:top-[var(--offset)]",
      center: "after:top-1/2 after:-translate-y-1/2",
      end: "after:bottom-[var(--offset)]",
    },
    right: {
      start: "after:top-[var(--offset)]",
      center: "after:top-1/2 after:-translate-y-1/2",
      end: "after:bottom-[var(--offset)]",
    },
  };

  return (
    <div
      className={clsx(
        base,
        arrowBase,
        arrowDirection[direction],
        arrowAlign[direction][align],
        className,
      )}
      style={
        {
          ["--offset" as any]:
            typeof offset === "number"
              ? `clamp(8px, ${offset}px, calc(100% - 16px))`
              : offset,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
