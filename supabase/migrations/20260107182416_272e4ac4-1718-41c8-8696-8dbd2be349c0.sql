-- Create pricing_tiers table for complex pricing (quad bikes, team building, venues)
CREATE TABLE public.pricing_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  tier_type text NOT NULL DEFAULT 'simple', -- 'time', 'package', 'capacity', 'simple'
  price_weekday numeric,
  price_weekend numeric,
  price_weekday_double numeric, -- For double occupancy (quad bikes)
  price_weekend_double numeric, -- For double occupancy (quad bikes)
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can view pricing tiers (public data)
CREATE POLICY "Anyone can view pricing tiers"
ON public.pricing_tiers
FOR SELECT
USING (true);

-- Staff can manage pricing tiers
CREATE POLICY "Staff can manage pricing tiers"
ON public.pricing_tiers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_tiers_updated_at
BEFORE UPDATE ON public.pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();