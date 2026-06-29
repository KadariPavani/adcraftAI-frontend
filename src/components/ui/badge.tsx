import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border-border",
        soft: "border-transparent bg-primary/10 text-primary ring-1 ring-primary/15",
        "soft-accent": "border-transparent bg-accent/10 text-accent ring-1 ring-accent/15",
        "soft-success": "border-transparent bg-success/10 text-success ring-1 ring-success/15",
        "soft-tertiary": "border-transparent bg-tertiary/10 text-tertiary ring-1 ring-tertiary/15",
        gradient: "border-transparent bg-gradient-marigold text-primary-foreground shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
