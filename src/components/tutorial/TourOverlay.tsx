import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { useTutorialStore } from "@/stores/tutorialStore";
import { tourSteps } from "@/data/tutorialContent";
import { TourTooltip } from "./TourTooltip";

export function TourOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourStep, tourActive, nextStep, prevStep, skipTour } =
    useTutorialStore();
  const highlightRef = useRef<HTMLElement | null>(null);

  const step = tourSteps[tourStep];
  const isFirst = tourStep === 0;
  const isLast = tourStep === tourSteps.length - 1;

  // Navigate to the correct route when step changes
  useEffect(() => {
    if (!tourActive || !step) return;

    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [tourActive, tourStep, step, navigate, location.pathname]);

  // Highlight target element on Dashboard
  useEffect(() => {
    if (!tourActive || !step?.targetSelector) {
      // Clean up previous highlight
      if (highlightRef.current) {
        highlightRef.current.style.removeProperty("box-shadow");
        highlightRef.current.style.removeProperty("position");
        highlightRef.current.style.removeProperty("z-index");
        highlightRef.current = null;
      }
      return;
    }

    // Small delay to let page render
    const timeout = setTimeout(() => {
      const el = document.querySelector(
        step.targetSelector!
      ) as HTMLElement | null;

      // Clean up previous
      if (highlightRef.current && highlightRef.current !== el) {
        highlightRef.current.style.removeProperty("box-shadow");
        highlightRef.current.style.removeProperty("position");
        highlightRef.current.style.removeProperty("z-index");
      }

      if (el) {
        el.style.boxShadow =
          "0 0 0 3px rgba(16, 185, 129, 0.4), 0 0 20px 4px rgba(16, 185, 129, 0.15)";
        el.style.position = "relative";
        el.style.zIndex = "55";
        highlightRef.current = el;

        // Scroll into view
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (highlightRef.current) {
        highlightRef.current.style.removeProperty("box-shadow");
        highlightRef.current.style.removeProperty("position");
        highlightRef.current.style.removeProperty("z-index");
        highlightRef.current = null;
      }
    };
  }, [tourActive, tourStep, step]);

  if (!tourActive || !step) return null;

  const handleNext = () => {
    if (isLast) {
      skipTour();
      navigate("/");
    } else {
      nextStep();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <TourTooltip
        key={tourStep}
        title={step.title}
        description={step.description}
        stepNumber={tourStep}
        totalSteps={tourSteps.length}
        onNext={handleNext}
        onPrev={prevStep}
        onSkip={skipTour}
        isFirst={isFirst}
        isLast={isLast}
      />
    </AnimatePresence>
  );
}
