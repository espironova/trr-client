import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingTier } from '@/lib/supabase-types';

interface RateCardTableProps {
  tiers: PricingTier[];
  tierType: string;
  isNonResident?: boolean;
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return '-';
  return `${price.toLocaleString()}`;
}

export function RateCardTable({ tiers, tierType, isNonResident = false }: RateCardTableProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Check for double occupancy based on resident status
  const hasDoubleOccupancy = tiers.some(t => 
    isNonResident 
      ? (t.price_weekday_double_nonres !== null || t.price_weekend_double_nonres !== null)
      : (t.price_weekday_double !== null || t.price_weekend_double !== null)
  );
  
  const currency = isNonResident ? '$' : 'KES';
  
  // Show first 3 tiers when collapsed
  const visibleTiers = expanded ? tiers : tiers.slice(0, 3);
  const hasMore = tiers.length > 3;

  // Get the appropriate price based on resident status
  const getPrice = (tier: PricingTier, field: 'weekday' | 'weekend' | 'weekday_double' | 'weekend_double') => {
    if (isNonResident) {
      switch (field) {
        case 'weekday': return tier.price_weekday_nonres;
        case 'weekend': return tier.price_weekend_nonres;
        case 'weekday_double': return tier.price_weekday_double_nonres;
        case 'weekend_double': return tier.price_weekend_double_nonres;
      }
    } else {
      switch (field) {
        case 'weekday': return tier.price_weekday;
        case 'weekend': return tier.price_weekend;
        case 'weekday_double': return tier.price_weekday_double;
        case 'weekend_double': return tier.price_weekend_double;
      }
    }
  };

  if (tierType === 'package') {
    // Package-style display (Team Building)
    return (
      <div className="mt-3 space-y-2">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-foreground">{tier.tier_name}</span>
                {tier.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                )}
              </div>
              <div className="text-right">
                {getPrice(tier, 'weekday') !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Wkday: </span>
                    <span className="font-semibold text-secondary">{currency} {formatPrice(getPrice(tier, 'weekday'))}</span>
                  </div>
                )}
                {getPrice(tier, 'weekend') !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Wkend: </span>
                    <span className="font-semibold text-secondary">{currency} {formatPrice(getPrice(tier, 'weekend'))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table-style display for time-based and capacity-based pricing
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-2 font-medium text-muted-foreground">
              {tierType === 'time' ? 'Duration' : tierType === 'capacity' ? 'Capacity' : 'Option'}
            </th>
            {hasDoubleOccupancy ? (
              <>
                <th className="text-right py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="text-xs">Wkday</span>
                  <span className="block text-[10px]">Single</span>
                </th>
                <th className="text-right py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="text-xs">Wkday</span>
                  <span className="block text-[10px]">Double</span>
                </th>
                <th className="text-right py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="text-xs">Wkend</span>
                  <span className="block text-[10px]">Single</span>
                </th>
                <th className="text-right py-2 pl-1 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="text-xs">Wkend</span>
                  <span className="block text-[10px]">Double</span>
                </th>
              </>
            ) : (
              <>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Weekday</th>
                <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Weekend</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleTiers.map((tier, index) => (
            <tr 
              key={tier.id} 
              className={cn(
                "border-b border-border/50 last:border-0",
                index % 2 === 0 ? "bg-muted/30" : ""
              )}
            >
              <td className="py-2 pr-2 font-medium text-foreground">{tier.tier_name}</td>
              {hasDoubleOccupancy ? (
                <>
                  <td className="text-right py-2 px-1 text-secondary font-semibold">
                    {formatPrice(getPrice(tier, 'weekday'))}
                  </td>
                  <td className="text-right py-2 px-1 text-secondary font-semibold">
                    {formatPrice(getPrice(tier, 'weekday_double'))}
                  </td>
                  <td className="text-right py-2 px-1 text-secondary font-semibold">
                    {formatPrice(getPrice(tier, 'weekend'))}
                  </td>
                  <td className="text-right py-2 pl-1 text-secondary font-semibold">
                    {formatPrice(getPrice(tier, 'weekend_double'))}
                  </td>
                </>
              ) : (
                <>
                  <td className="text-right py-2 px-2 text-secondary font-semibold">
                    {getPrice(tier, 'weekday') !== null ? `${currency} ${formatPrice(getPrice(tier, 'weekday'))}` : '-'}
                  </td>
                  <td className="text-right py-2 pl-2 text-secondary font-semibold">
                    {getPrice(tier, 'weekend') !== null ? `${currency} ${formatPrice(getPrice(tier, 'weekend'))}` : '-'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 py-1.5 text-sm text-primary font-medium flex items-center justify-center gap-1 hover:bg-primary/5 rounded transition-colors"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View all {tiers.length} rates <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
