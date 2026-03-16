import { cn } from '@/lib/utils';
import { Share2, Clock } from 'lucide-react';
import { RateCardTable } from './RateCardTable';
import { LazyImage } from './LazyImage';
import { useToast } from '@/hooks/use-toast';
import type { ActivityWithCategory, PricingTier } from '@/lib/supabase-types';

interface ActivityCardProps {
  activity: ActivityWithCategory & { pricing_tiers?: PricingTier[]; operating_hours?: string | null };
  index: number;
  isNonResident?: boolean;
}

function formatPrice(price: number | null, isNonResident: boolean): string | null {
  if (price === null) return null;
  if (price === 0) return 'FREE';
  const currency = isNonResident ? '$' : 'KES ';
  return `${currency}${price.toLocaleString()}`;
}

export function ActivityCard({ activity, index, isNonResident = false }: ActivityCardProps) {
  const { toast } = useToast();
  const price = isNonResident ? activity.price_nonres : activity.price;
  const priceWeekday = isNonResident ? activity.price_weekday_nonres : activity.price_weekday;
  const priceWeekend = isNonResident ? activity.price_weekend_nonres : activity.price_weekend;
  
  const hasWeekdayWeekendPricing = priceWeekday !== null || priceWeekend !== null;
  const hasPricingTiers = activity.pricing_tiers && activity.pricing_tiers.length > 0;
  const tierType = hasPricingTiers ? activity.pricing_tiers[0].tier_type : 'simple';

  const handleShare = async () => {
    const url = `${window.location.origin}/activities?highlight=${activity.id}`;
    const shareData = { title: activity.name, text: `Check out ${activity.name} at Twin Rivers Resort!`, url };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
  };
  
  return (
    <div 
      className={cn(
        "bg-card rounded-lg overflow-hidden shadow-card border border-border/50",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {activity.image_url && (
        <LazyImage src={activity.image_url} alt={activity.name} />
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
                {activity.name}
              </h3>
              <button
                onClick={handleShare}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Share activity"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            {activity.description && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                {activity.description}
              </p>
            )}
            {(activity as any).operating_hours && (
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {(activity as any).operating_hours}
              </p>
            )}
          </div>
          
          {!hasPricingTiers && (
            <div className="text-right shrink-0">
              {hasWeekdayWeekendPricing ? (
                <div className="space-y-1">
                  {priceWeekday !== null && (
                    <div>
                      <span className="text-xs text-muted-foreground block">Weekday</span>
                      <span className="font-display text-lg font-bold text-secondary">
                        {formatPrice(priceWeekday, isNonResident)}
                      </span>
                    </div>
                  )}
                  {priceWeekend !== null && (
                    <div>
                      <span className="text-xs text-muted-foreground block">Weekend</span>
                      <span className="font-display text-lg font-bold text-secondary">
                        {formatPrice(priceWeekend, isNonResident)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="font-display text-xl font-bold text-secondary">
                  {formatPrice(price, isNonResident) ?? activity.price_note ?? 'Price on request'}
                </span>
              )}
            </div>
          )}
        </div>
        
        {hasPricingTiers && (
          <RateCardTable 
            tiers={activity.pricing_tiers!} 
            tierType={tierType} 
            isNonResident={isNonResident}
          />
        )}
        
        {activity.price_note && (
          <p className="mt-2 text-xs text-muted-foreground italic border-t border-border/50 pt-2">
            {activity.price_note}
          </p>
        )}
      </div>
    </div>
  );
}
