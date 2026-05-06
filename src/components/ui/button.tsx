import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN.md §4 Buttons — Ink pill (≈20px radius), uppercase reserved for eyebrows only.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-[-0.02em]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-[1.5px] border-primary hover:bg-primary/90",
        destructive: "rounded-button bg-destructive text-destructive-foreground border-0 hover:bg-destructive/90",
        outline:
          "border-[1.5px] border-foreground bg-white dark:bg-card text-foreground hover:bg-accent hover:text-accent-foreground rounded-button",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85 rounded-button border border-transparent",
        ghost: "rounded-button hover:bg-accent hover:text-accent-foreground border border-transparent bg-transparent",
        link: "text-link underline-offset-4 hover:underline rounded-button border-0",
      },
      size: {
        default: "h-11 px-6 py-1.5",
        sm: "h-10 rounded-button px-4 text-sm",
        lg: "h-12 px-10 py-2 text-base rounded-button",
        icon: "h-11 w-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
