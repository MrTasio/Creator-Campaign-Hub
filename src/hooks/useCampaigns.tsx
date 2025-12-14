import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Creator {
  id: string;
  name: string;
  email: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed';
  cpm_rate: number;
  cpc_rate: number;
  total_views: number;
  total_clicks: number;
  ctr: number;
  estimated_payout: number;
  created_at: string;
  creator_id: string;
  creators: Creator;
  target_link: string;
}

export interface CampaignEvent {
  id: string;
  event_type: 'view' | 'click';
  source: string;
  created_at: string;
}

export function useCreators() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['creators', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Creator[];
    },
    enabled: !!user,
  });
}

export function useCreateCreator() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email?: string }) => {
      const { data, error } = await supabase
        .from('creators')
        .insert({ name, email, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      toast.success('Creator added');
    },
    onError: (error) => {
      toast.error('Failed to add creator: ' + error.message);
    },
  });
}

export function useCampaigns() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          creators (id, name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });
}

export function useCampaign(id: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          creators (id, name, email)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Campaign | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCampaignEvents(campaignId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign-events', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as CampaignEvent[];
    },
    enabled: !!user && !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      target_link: string;
      creator_id: string;
      status?: 'draft' | 'active' | 'completed';
      cpm_rate?: number;
      cpc_rate?: number;
    }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, user_id: user!.id })
        .select(`*, creators (id, name, email)`)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      target_link?: string;
      status?: 'draft' | 'active' | 'completed';
      cpm_rate?: number;
      cpc_rate?: number;
    }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast.success('Campaign updated');
    },
    onError: (error) => {
      toast.error('Failed to update campaign: ' + error.message);
    },
  });
}

export function useAddManualEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ campaignId, eventType, count = 1 }: {
      campaignId: string;
      eventType: 'view' | 'click';
      count?: number;
    }) => {
      const events = Array.from({ length: count }, () => ({
        campaign_id: campaignId,
        event_type: eventType,
        source: 'manual',
      }));
      
      const { error: insertError } = await supabase
        .from('campaign_events')
        .insert(events);
      
      if (insertError) throw insertError;
      
      // Call the update metrics function
      const { error: updateError } = await supabase
        .rpc('update_campaign_metrics', { campaign_uuid: campaignId });
      
      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-events', variables.campaignId] });
      toast.success('Events added');
    },
    onError: (error) => {
      toast.error('Failed to add events: ' + error.message);
    },
  });
}