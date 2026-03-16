import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, ActivityWithCategory, PricingTier } from '@/lib/supabase-types';

export function useActivities(categoryId?: string) {
  return useQuery({
    queryKey: ['activities', categoryId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*, categories(*)')
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ActivityWithCategory[];
    },
  });
}

export function useActivitiesWithPricingTiers(categoryId?: string) {
  return useQuery({
    queryKey: ['activities-with-tiers', categoryId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*, categories(*)')
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data: activities, error } = await query;
      if (error) throw error;

      // Fetch all pricing tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (tiersError) throw tiersError;

      // Map tiers to activities
      const activitiesWithTiers = (activities as ActivityWithCategory[]).map(activity => ({
        ...activity,
        pricing_tiers: (tiers as PricingTier[]).filter(t => t.activity_id === activity.id)
      }));

      return activitiesWithTiers;
    },
  });
}

export function usePricingTiers(activityId?: string) {
  return useQuery({
    queryKey: ['pricing-tiers', activityId],
    queryFn: async () => {
      let query = supabase
        .from('pricing_tiers')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (activityId) {
        query = query.eq('activity_id', activityId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PricingTier[];
    },
    enabled: !!activityId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Activity> & { id: string }) => {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}

export function useCreatePricingTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tier: Omit<PricingTier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .insert(tier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}

export function useUpdatePricingTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingTier> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}

export function useDeletePricingTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_tiers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['activities-with-tiers'] });
    },
  });
}
