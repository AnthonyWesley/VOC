import { motion } from "framer-motion";
import { ComponentProps } from "react";

type AnimatedSectionProps = ComponentProps<typeof motion.div>;

export default function AnimatedSection({
  children,
  ...props
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.85 }}
      className="text-sm"
      {...props}
    >
      {children}
    </motion.div>
  );
}
