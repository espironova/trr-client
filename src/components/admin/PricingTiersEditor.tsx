import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  usePricingTiers,
  useCreatePricingTier,
  useUpdatePricingTier,
  useDeletePricingTier,
} from '@/hooks/useActivities';
import type { PricingTier } from '@/lib/supabase-types';

interface PricingTiersEditorProps {
  activityId: string;
  activityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIER_TYPES = [
  { value: 'time', label: 'Time-based (e.g., 15 mins, 30 mins)' },
  { value: 'package', label: 'Package (e.g., Bronze, Gold)' },
  { value: 'capacity', label: 'Capacity (e.g., 2 pax, 4 pax)' },
  { value: 'simple', label: 'Simple pricing' },
];

type TierType = 'time' | 'package' | 'capacity' | 'simple';

interface TierFormData {
  id?: string;
  tier_name: string;
  tier_type: TierType;
  price_weekday: string;
  price_weekend: string;
  price_weekday_double: string;
  price_weekend_double: string;
  price_weekday_nonres: string;
  price_weekend_nonres: string;
  price_weekday_double_nonres: string;
  price_weekend_double_nonres: string;
  description: string;
  display_order: number;
  isNew?: boolean;
  isModified?: boolean;
}

export function PricingTiersEditor({
  activityId,
  activityName,
  open,
  onOpenChange,
}: PricingTiersEditorProps) {
  const { toast } = useToast();
  const { data: tiers = [], isLoading } = usePricingTiers(activityId);
  const createTier = useCreatePricingTier();
  const updateTier = useUpdatePricingTier();
  const deleteTier = useDeletePricingTier();

  const [localTiers, setLocalTiers] = useState<TierFormData[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tiers.length > 0) {
      setLocalTiers(
        tiers.map((t) => ({
          id: t.id,
          tier_name: t.tier_name,
          tier_type: t.tier_type as TierType,
          price_weekday: t.price_weekday?.toString() || '',
          price_weekend: t.price_weekend?.toString() || '',
          price_weekday_double: t.price_weekday_double?.toString() || '',
          price_weekend_double: t.price_weekend_double?.toString() || '',
          price_weekday_nonres: t.price_weekday_nonres?.toString() || '',
          price_weekend_nonres: t.price_weekend_nonres?.toString() || '',
          price_weekday_double_nonres: t.price_weekday_double_nonres?.toString() || '',
          price_weekend_double_nonres: t.price_weekend_double_nonres?.toString() || '',
          description: t.description || '',
          display_order: t.display_order,
          isNew: false,
          isModified: false,
        }))
      );
    } else {
      setLocalTiers([]);
    }
  }, [tiers]);

  const addNewTier = () => {
    setLocalTiers((prev) => [
      ...prev,
      {
        tier_name: '',
        tier_type: 'time',
        price_weekday: '',
        price_weekend: '',
        price_weekday_double: '',
        price_weekend_double: '',
        price_weekday_nonres: '',
        price_weekend_nonres: '',
        price_weekday_double_nonres: '',
        price_weekend_double_nonres: '',
        description: '',
        display_order: prev.length,
        isNew: true,
        isModified: true,
      },
    ]);
  };

  const updateLocalTier = (
    index: number,
    field: keyof TierFormData,
    value: string | number | TierType
  ) => {
    setLocalTiers((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, [field]: value, isModified: true } : t
      )
    );
  };

  const removeTier = async (index: number) => {
    const tier = localTiers[index];
    if (tier.id && !tier.isNew) {
      try {
        await deleteTier.mutateAsync(tier.id);
        toast({ title: 'Tier deleted' });
      } catch {
        toast({ title: 'Failed to delete tier', variant: 'destructive' });
        return;
      }
    }
    setLocalTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const tier of localTiers) {
        if (!tier.isModified) continue;

        const tierData = {
          activity_id: activityId,
          tier_name: tier.tier_name,
          tier_type: tier.tier_type,
          price_weekday: tier.price_weekday ? parseFloat(tier.price_weekday) : null,
          price_weekend: tier.price_weekend ? parseFloat(tier.price_weekend) : null,
          price_weekday_double: tier.price_weekday_double ? parseFloat(tier.price_weekday_double) : null,
          price_weekend_double: tier.price_weekend_double ? parseFloat(tier.price_weekend_double) : null,
          price_weekday_nonres: tier.price_weekday_nonres ? parseFloat(tier.price_weekday_nonres) : null,
          price_weekend_nonres: tier.price_weekend_nonres ? parseFloat(tier.price_weekend_nonres) : null,
          price_weekday_double_nonres: tier.price_weekday_double_nonres ? parseFloat(tier.price_weekday_double_nonres) : null,
          price_weekend_double_nonres: tier.price_weekend_double_nonres ? parseFloat(tier.price_weekend_double_nonres) : null,
          description: tier.description || null,
          display_order: tier.display_order,
        };

        if (tier.isNew) {
          await createTier.mutateAsync(tierData);
        } else if (tier.id) {
          await updateTier.mutateAsync({ id: tier.id, ...tierData });
        }
      }
      toast({ title: 'Pricing tiers saved' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to save pricing tiers', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Pricing Tiers: {activityName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {localTiers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No pricing tiers yet. Add one below.
              </p>
            ) : (
              localTiers.map((tier, index) => (
                <div
                  key={tier.id || `new-${index}`}
                  className="border border-border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      Tier {index + 1}
                      {tier.isNew && (
                        <span className="ml-2 text-xs text-primary">(New)</span>
                      )}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tier Name *</Label>
                      <Input
                        value={tier.tier_name}
                        onChange={(e) => updateLocalTier(index, 'tier_name', e.target.value)}
                        placeholder="e.g., 15 Minutes"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={tier.tier_type}
                        onValueChange={(v) => updateLocalTier(index, 'tier_type', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Resident Pricing */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      Resident Pricing (KES)
                    </h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Weekday (Single)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekday}
                          onChange={(e) => updateLocalTier(index, 'price_weekday', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekend (Single)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekend}
                          onChange={(e) => updateLocalTier(index, 'price_weekend', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekday (Double)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekday_double}
                          onChange={(e) => updateLocalTier(index, 'price_weekday_double', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekend (Double)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekend_double}
                          onChange={(e) => updateLocalTier(index, 'price_weekend_double', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Non-Resident Pricing */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      Non-Resident Pricing ($)
                    </h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Weekday (Single)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekday_nonres}
                          onChange={(e) => updateLocalTier(index, 'price_weekday_nonres', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekend (Single)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekend_nonres}
                          onChange={(e) => updateLocalTier(index, 'price_weekend_nonres', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekday (Double)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekday_double_nonres}
                          onChange={(e) => updateLocalTier(index, 'price_weekday_double_nonres', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weekend (Double)</Label>
                        <Input
                          type="number"
                          value={tier.price_weekend_double_nonres}
                          onChange={(e) => updateLocalTier(index, 'price_weekend_double_nonres', e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input
                      value={tier.description}
                      onChange={(e) => updateLocalTier(index, 'description', e.target.value)}
                      placeholder="e.g., Minimum 2 pax"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={addNewTier}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tier
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
