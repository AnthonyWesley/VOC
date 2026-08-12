// components/CodeInput.tsx
import { useRef } from "react";

interface CodeInputProps {
  codeArray: string[];
  setCodeArray: (code: string[]) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

const CODE_LENGTH = 8;

export default function CodeInput({
  codeArray,
  setCodeArray,
  onPaste,
}: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return;

    const newCode = [...codeArray];
    newCode[index] = value.toUpperCase();
    setCodeArray(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {codeArray.map((char, index) => (
        <input
          key={index}
          ref={(el: any) => (inputsRef.current[index] = el)}
          type="text"
          maxLength={1}
          value={char}
          onChange={(e) => handleChange(index, e.target.value)}
          onPaste={onPaste}
          className="h-10 w-10 rounded bg-white/10 text-center text-lg font-bold text-[var(--text-primary)] uppercase focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
      ))}
    </div>
  );
}
