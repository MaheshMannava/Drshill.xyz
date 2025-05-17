import * as React from "react";
import { cn } from "../../lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("rounded-lg border border-gray-200 bg-white shadow-sm", className)} {...props} />;
});

Card.displayName = "Card";

export { Card };
