import { Icon as IconifyIcon } from "@iconify/react";
import { fluidScale } from "../helpers/fluidScale";

type IconProps = {
  icon: string;
  info?: string;
  className?: string;
  indicator?: string | number;
  text?: string | number;
  infoDirection?: "top" | "bottom" | "left" | "right";
  textDiction?: "top" | "bottom" | "left" | "right";
  scale?: number;
  isPending?: boolean;
  onClick?: () => void;
};
export default function Icon({
  icon,
  info,
  className,
  infoDirection = "top",
  indicator,
  text = "",
  textDiction = "right",
  scale = 0.6,
  isPending,
  onClick,
}: IconProps) {
  const infoDictionObj = {
    top: "tooltip-top",
    bottom: "tooltip-bottom",
    left: "tooltip-left",
    right: "tooltip-right",
  };
  const textDictionObj = {
    top: "flex-col-reverse",
    bottom: "flex-col",
    left: "flex-row-reverse",
    right: "flex-row",
  };
  const tooltipClass = info ? `tooltip ${infoDictionObj[infoDirection]}` : "";

  return (
    <div
      className={`${tooltipClass} indicator flex items-center gap-6 ${textDictionObj[textDiction]} ${className}`}
      data-tip={info}
      onClick={onClick}
    >
      <IconifyIcon
        icon={isPending ? "line-md:loading-twotone-loop" : icon}
        style={{
          fontSize: fluidScale(scale + 0.3),
        }}
      />
      {text && (
        <span
          style={{
            fontSize: fluidScale(scale),
          }}
        >
          {text}
        </span>
      )}

      {indicator && (
        <span className="indicator-item badge rounded-full bg-transparent">
          {indicator}
        </span>
      )}
    </div>
  );
}
