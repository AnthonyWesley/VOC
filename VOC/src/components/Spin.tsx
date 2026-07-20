type SpinProps = {
  style?: "default" | "no-modal";
};

export default function Spin({ style = "default" }: SpinProps) {
  return (
    <div
      className={` ${style === "default" ? "fixed inset-0 z-50 flex h-screen items-center justify-center bg-[var(--bg-bot)]/70 backdrop-blur-sm" : "col-span-full flex items-center justify-center"} `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 66 66"
        height="100"
        width="100"
        className="animate-spin"
      >
        <defs>
          <linearGradient id="gradient">
            <stop stopOpacity="1" stopColor="var(--accent-cyan)" offset="0%" />
            <stop stopOpacity="0" stopColor="var(--accent-purple)" offset="100%" />
          </linearGradient>
        </defs>
        <circle
          cx="33"
          cy="33"
          r="20"
          stroke="url(#gradient)"
          strokeWidth="1"
          fill="transparent"
          className="stroke-dasharray-[100] stroke-dashoffset-[20] stroke-linecap-round"
        />
      </svg>
    </div>
  );
}
