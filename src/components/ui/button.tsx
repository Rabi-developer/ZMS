import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/components/lib/StaticData/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#181a26] text-white shadow-lg hover:bg-[#161823] hover:shadow-2xl focus:ring-2 focus:ring-[#181a26]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 focus:ring-2 focus:ring-destructive",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-accent",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 focus:ring-2 focus:ring-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-accent",
        link: "text-primary underline-offset-4 hover:underline focus:ring-2 focus:ring-primary",
        appBtn:
          "bg-yellow-500 text-black border-input border shadow-md hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
