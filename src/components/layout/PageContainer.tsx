import type { ReactNode } from "react";
import { motion } from "motion/react";
import { pageEnter } from "@/lib/animations";
import { ScenarioBanner } from "@/components/shared/ScenarioBanner";

interface PageContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function PageContainer({
  children,
  title,
  description,
}: PageContainerProps) {
  return (
    <motion.div
      variants={pageEnter}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>

      {/* Active Scenario Banner */}
      <ScenarioBanner />

      {/* Page Content */}
      {children}
    </motion.div>
  );
}
