type TooltipProps = {
  info?: string;
  text?: string;
  className?: string;
};

export default function Tooltip({ className, info, text }: TooltipProps) {
  return (
    <div className={`tooltip ${className}`} data-tip={info}>
      <button className="btn">{text}</button>
    </div>
  );
}
