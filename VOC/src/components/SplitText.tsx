import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ElementType } from "react";

type SplitTextProps = {
  message: string;
  className?: string;
  tag?: ElementType;
};

export default function SplitText({
  message,
  className = "",
  tag: Tag = "h1",
}: SplitTextProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setVisible(true);
    });
  }, []);

  const words = message.split(" ");

  return (
    <div
      style={{
        visibility: visible ? "visible" : "hidden",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5ch",
        maxWidth: "600px",
      }}
    >
      <Tag
        className={`split-text ${className}`}
        style={{ display: "contents" }}
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", bounce: 0.3 }}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {word + " "}
          </motion.span>
        ))}
      </Tag>
    </div>
  );
}
