import { forwardRef, type ReactNode, type KeyboardEvent } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/cn";

type MotionDivProps = Omit<HTMLMotionProps<"div">, "children" | "onClick">;

interface ClickableRowProps extends MotionDivProps {
  onActivate: () => void;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ClickableRow = forwardRef<HTMLDivElement, ClickableRowProps>(
  function ClickableRow(
    { onActivate, ariaLabel, children, className, disabled, ...rest },
    ref,
  ) {
    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    };
    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onActivate}
        onKeyDown={handleKey}
        className={cn(
          "cursor-pointer active:scale-[0.98] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-0",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
