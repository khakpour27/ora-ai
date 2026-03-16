import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  triggered?: boolean;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  speed = 25,
  className,
  onComplete,
  triggered = true,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!triggered) {
      setDisplayed("");
      setIsDone(false);
      indexRef.current = 0;
      return;
    }

    indexRef.current = 0;
    setDisplayed("");
    setIsDone(false);

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        setIsDone(true);
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, triggered]);

  return (
    <span className={cn(className)}>
      {displayed}
      {showCursor && !isDone && triggered && (
        <span className="inline-block w-0.5 h-[1em] bg-emerald-400 animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
}
