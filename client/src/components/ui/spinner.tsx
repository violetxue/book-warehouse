import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

function Spinner({
  className,
  label = "加载中...",
  size = "sm",
  ...props
}: React.ComponentProps<"div"> & {
  label?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}) {
  const sizeClasses = {
    xs: "size-3",
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
    xl: "size-12",
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export { Spinner }
