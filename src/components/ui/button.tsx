import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variant === 'default' && "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold",
          variant === 'ghost' && "hover:bg-zinc-800 text-zinc-300",
          variant === 'outline' && "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-200",
          variant === 'secondary' && "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
          size === 'default' && "h-9 px-4 py-2 text-xs",
          size === 'sm' && "h-8 rounded-lg px-3 text-xs",
          size === 'lg' && "h-10 rounded-xl px-8",
          size === 'icon' && "h-9 w-9",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button }