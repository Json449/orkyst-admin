import { OrkystLogo } from "@/components/orkyst-logo";
import { cn } from "@/lib/utils";

function OrkystLoader({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="orkyst-loader-ring absolute inset-0 rounded-full" />
        <div className="absolute inset-1 rounded-full bg-card" />
        <div className="relative text-primary">
          <OrkystLogo className="h-8 w-8" />
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export { OrkystLoader };
