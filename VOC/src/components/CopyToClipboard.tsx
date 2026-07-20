import { useState } from "react";
import { Icon } from "@iconify/react";

type CopyToClipboardProps = {
  text: string;
  label?: string;
};

export default function CopyToClipboard({
  text,
  label = "Copiar",
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (text) {
        await navigator?.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex cursor-pointer items-center gap-2 text-base text-cyan-400 hover:underline"
    >
      <Icon
        icon={
          copied
            ? "material-symbols:check-circle"
            : "material-symbols:content-copy"
        }
        className="h-5 w-5"
      />
      {copied ? "Copiado!" : label}
    </button>
  );
}
