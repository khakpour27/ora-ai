import type { ReactNode } from "react";
import { motion } from "motion/react";
import { glowPulse } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowing?: boolean;
  glowColor?: string;
}

export function GlowCard({
  children,
  className,
  glowing = true,
  glowColor = "rgba(16, 185, 129, 0.1)",
}: GlowCardProps) {
  return (
    <motion.div
      variants={glowing ? glowPulse : undefined}
      animate={glowing ? "animate" : undefined}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "p-6 relative hover:z-10",
        className
      )}
      whileHover={{
        boxShadow: `0 0 24px 4px ${glowColor}`,
        transition: { duration: 0.3 },
      }}
    >
      {children}
    </motion.div>
  );
}
