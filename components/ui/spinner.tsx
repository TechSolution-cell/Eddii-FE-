import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerWrap = cva("inline-block align-middle animate-spin", {
    variants: {
        size: {
            sm: "h-4 w-4",   // 16
            md: "h-6 w-6",   // 24
            lg: "h-8 w-8",   // 32
            xl: "h-12 w-12", // 48
        },
        speed: {
            normal: "animate-spin",
            fast: "[animation-duration:750ms]",
            faster: "[animation-duration:500ms]",
            slow: "[animation-duration:1500ms]",
        },
    },
    defaultVariants: {
        size: "xl",
        speed: "normal",
    },
})

const colorMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
    muted: "text-muted-foreground",
    white: "text-white",
    black: "text-black",
    blue: "text-blue-600",
    "purple-50": "text-purple-50",
    "purple-100": "text-purple-100",
    "purple-200": "text-purple-200",
    "purple-300": "text-purple-300",
    "purple-400": "text-purple-400",
    "purple-500": "text-purple-500",
    "purple-600": "text-purple-600",
    "purple-700": "text-purple-700",    
    "purple-800": "text-purple-800",
    "purple-900": "text-purple-900",
    "purple-950": "text-purple-950",
} as const

type ColorKey = keyof typeof colorMap

export interface SpinnerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerWrap> {
    /** Ring (moving arc) color */
    variant?: ColorKey
    /** Track (background ring) color */
    track?: ColorKey
    /** SR-only text */
    label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
    ({ className, size, speed, variant = "primary", track = "muted", label = "Loading…", ...props }, ref) => {
        return (
            <div ref={ref} role="status" className={cn("inline-flex items-center", className)} {...props}>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 100 101"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(spinnerWrap({ size, speed }))}
                >
                    {/* Track: uses text-* via currentColor */}
                    <path
                        className={colorMap[track]}
                        fill="currentColor"
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    />
                    {/* Arc: uses text-* via currentColor */}
                    <path
                        className={colorMap[variant]}
                        fill="currentColor"
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    />
                </svg>
                <span className="sr-only">{label}</span>
            </div>
        )
    }
)
Spinner.displayName = "Spinner"

export { Spinner }
