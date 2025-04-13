import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'motion/react'

import { cn } from '~/lib/utils'

interface CounterProps {
  /**
   * A function to format the counter value. By default, it will format the
   * number with commas.
   */
  format?: (value: number) => string;

  /**
   * The target value of the counter.
   */
  targetValue: number;

  /**
   * The direction of the counter. If "up", the counter will start from 0 and
   * go up to the target value. If "down", the counter will start from the target
   * value and go down to 0.
   */
  direction?: "up" | "down";

  /**
   * The delay in milliseconds before the counter starts counting.
   */
  delay?: number;

  /**
   * Additional classes for the counter.
   */
  className?: string;

  /**
   * Font style classes for the counter.
   * @default "text-4xl font-bold text-foreground"
   */
  fontStyle?: string;

  /**
   * Whether to animate the counter.
   * @default true
   */
  animated?: boolean;
}

export const Formatter = {
  number: (value: number) => Intl.NumberFormat("en-US").format(+value.toFixed(0)),
  currency: (value: number) =>
    Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(+value.toFixed(0)),
};

export default function TextCounter({
  format = Formatter.number,
  targetValue,
  direction = "up",
  delay = 0,
  className,
  fontStyle = "text-4xl font-bold text-foreground",
  animated = true,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isGoingUp = direction === "up";
  const motionValue = useMotionValue(isGoingUp ? 0 : targetValue);

  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 80,
  });
  const isInView = useInView(ref, { margin: "0px", once: true });

  useEffect(() => {
    if (!animated) {
      // If animation is disabled, immediately set the content to the target value
      if (ref.current) {
        ref.current.textContent = format(targetValue);
      }
      return;
    }

    if (!isInView) {
      return;
    }

    const timer = setTimeout(() => {
      motionValue.set(isGoingUp ? targetValue : 0);
    }, delay);

    return () => clearTimeout(timer);
  }, [isInView, delay, isGoingUp, targetValue, motionValue, animated, format]);

  useEffect(() => {
    if (!animated) return; // Skip animation subscription if animation is disabled
    
    springValue.on("change", (value) => {
      if (ref.current) {
        // @ts-ignore
        ref.current.textContent = format ? format(value) : value;
      }
    });
  }, [springValue, format, animated]);

  return <span ref={ref} className={cn(fontStyle, className)} />;
}
