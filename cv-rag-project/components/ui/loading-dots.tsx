import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span 
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center gap-1", className)}
    >
      <span className="h-2 w-2 rounded-full bg-current animate-[loading_0.8s_infinite] [animation-delay:0.0s]" />
      <span className="h-2 w-2 rounded-full bg-current animate-[loading_0.8s_infinite] [animation-delay:0.2s]" />
      <span className="h-2 w-2 rounded-full bg-current animate-[loading_0.8s_infinite] [animation-delay:0.4s]" />
      <span className="sr-only">Loading...</span>
    </span>
  );
}
