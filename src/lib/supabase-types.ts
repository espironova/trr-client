export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_weekday: number | null;
  price_weekend: number | null;
  price_nonres: number | null;
  price_weekday_nonres: number | null;
  price_weekend_nonres: number | null;
  price_note: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithCategory extends Activity {
  categories: Category;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface PricingTier {
  id: string;
  activity_id: string;
  tier_name: string;
  tier_type: 'time' | 'package' | 'capacity' | 'simple';
  price_weekday: number | null;
  price_weekend: number | null;
  price_weekday_double: number | null;
  price_weekend_double: number | null;
  price_weekday_nonres: number | null;
  price_weekend_nonres: number | null;
  price_weekday_double_nonres: number | null;
  price_weekend_double_nonres: number | null;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithPricingTiers extends ActivityWithCategory {
  pricing_tiers?: PricingTier[];
}

export interface Feedback {
  id: string;
  name: string;
  phone: string | null;
  feedback_type: string;
  rating: number | null;
  message: string | null;
  status: string;
  admin_comment: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
