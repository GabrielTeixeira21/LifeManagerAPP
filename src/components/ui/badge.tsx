import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === 'default' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        variant === 'secondary' && "bg-zinc-800 text-zinc-300",
        variant === 'outline' && "border border-zinc-700 text-zinc-300",
        className
      )}
      {...props}
    />
  )
}
export { Badge }