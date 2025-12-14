import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/campaigns/StatCard';
import { StatusBadge } from '@/components/campaigns/StatusBadge';
import { EventsChart } from '@/components/campaigns/EventsChart';
import { ManualEventForm } from '@/components/campaigns/ManualEventForm';
import { TrackingInfo } from '@/components/campaigns/TrackingInfo';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCampaign, useCampaignEvents, useUpdateCampaign } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Eye, MousePointerClick, Percent, DollarSign } from 'lucide-react';

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id!);
  const { data: events = [] } = useCampaignEvents(id!);
  const updateCampaign = useUpdateCampaign();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || campaignLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Campaign not found</p>
            <Button asChild className="mt-4">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);

  const handleStatusChange = (status: 'draft' | 'active' | 'completed') => {
    updateCampaign.mutate({ id: campaign.id, status });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div><p className="text-muted-foreground mt-1">
                Creator: {campaign.creators?.name || '—'}
              </p>
              <p className="text-muted-foreground mt-1">
                Target Link: {campaign.target_link || '—'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={campaign.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Views"
            value={formatNumber(campaign.total_views)}
            icon={<Eye className="h-5 w-5" />}
          />
          <StatCard
            label="Total Clicks"
            value={formatNumber(campaign.total_clicks)}
            icon={<MousePointerClick className="h-5 w-5" />}
          />
          <StatCard
            label="CTR"
            value={`${campaign.ctr.toFixed(2)}%`}
            icon={<Percent className="h-5 w-5" />}
          />
          <StatCard
            label="Estimated Payout"
            value={formatCurrency(campaign.estimated_payout)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EventsChart events={events} />
          <div className="space-y-6">
            <ManualEventForm campaignId={campaign.id} />
            <TrackingInfo campaignId={campaign.id} />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 shadow-card p-6">
          <h3 className="font-medium mb-4">Payout Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">CPM Rate:</span>
              <span className="ml-2 font-medium">{formatCurrency(campaign.cpm_rate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CPC Rate:</span>
              <span className="ml-2 font-medium">{formatCurrency(campaign.cpc_rate)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Payout = (Views ÷ 1000 × CPM) + (Clicks × CPC)
          </p>
        </div>
      </main>
    </div>
  );
}