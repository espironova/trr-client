-- Add non-resident price columns to activities table
ALTER TABLE public.activities
ADD COLUMN price_nonres numeric,
ADD COLUMN price_weekday_nonres numeric,
ADD COLUMN price_weekend_nonres numeric;

-- Add non-resident price columns to pricing_tiers table
ALTER TABLE public.pricing_tiers
ADD COLUMN price_weekday_nonres numeric,
ADD COLUMN price_weekend_nonres numeric,
ADD COLUMN price_weekday_double_nonres numeric,
ADD COLUMN price_weekend_double_nonres numeric;