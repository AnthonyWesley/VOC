import { useState } from "react";

type CountProps = {
  maxValue?: number;
  onChange: (count: number) => void;
  initialValue?: number;
  label: string;
  className?: string;
};

export default function Counter({
  maxValue = 5,
  onChange,
  initialValue = 1,
  // label,
  className,
}: CountProps) {
  const [count, setCount] = useState(initialValue);

  const handleDecrement = () => {
    if (count > 1) {
      const newVal = count - 1;
      setCount(newVal);
      onChange(newVal);
    }
  };

  const handleIncrement = () => {
    if (count < maxValue) {
      const newVal = count + 1;
      setCount(newVal);
      onChange(newVal);
    }
  };

  return (
    <section className={`flex flex-col items-center ${className}`}>
      {/* <span className="text-xs text-slate-500">{label}</span> */}
      <div className="mx-auto flex items-center justify-center rounded-2xl border border-gray-500/15">
        <button
          type="button"
          onClick={handleDecrement}
          className="flex h-8 w-16 cursor-pointer items-center justify-center text-[var(--text-primary)]"
          style={{ opacity: count === 1 ? "50%" : "100%" }}
          disabled={count === 1}
        >
          -
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full border-t border-b border-gray-500/15 text-xs text-slate-100">
          {count}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          className="flex h-8 w-16 cursor-pointer items-center justify-center text-[var(--text-primary)]"
          style={{ opacity: count === maxValue ? "50%" : "100%" }}
          disabled={count === maxValue}
        >
          +
        </button>
      </div>
    </section>
  );
}
