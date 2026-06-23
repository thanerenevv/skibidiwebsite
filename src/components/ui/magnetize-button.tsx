import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import type React from "react";

interface MagnetizeButtonProps extends HTMLMotionProps<'button'> {
  particleCount?: number;
  particleColor?: string;
}

function MagnetizeButton({
  className,
  children,
  ...props
}: MagnetizeButtonProps) {
  return (
    <motion.button
      className={cn('relative', className)}
      {...props}
    >
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
        {children as React.ReactNode}
      </span>
    </motion.button>
  );
}

export { MagnetizeButton };
