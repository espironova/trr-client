import { cn } from '@/lib/utils';

interface PricingToggleProps {
  isNonResident: boolean;
  onToggle: (isNonResident: boolean) => void;
}

export function PricingToggle({ isNonResident, onToggle }: PricingToggleProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container py-3">
        <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full max-w-xs mx-auto">
          <button
            onClick={() => onToggle(false)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
              !isNonResident
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Resident (KES)
          </button>
          <button
            onClick={() => onToggle(true)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
              isNonResident
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Non-Resident ($)
          </button>
        </div>
      </div>
    </div>
  );
}
