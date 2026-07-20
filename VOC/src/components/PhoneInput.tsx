import Cleave from "cleave.js/react";

export default function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <Cleave
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={{
        blocks: [0, 2, 5, 4], // DDD + número
        delimiters: ["(", ") ", "-"],
        numericOnly: true,
      }}
      placeholder="(99) 99999-9999"
      className="w-full rounded bg-white/10 p-2 text-[var(--text-primary)] placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
    />
  );
}
