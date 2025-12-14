import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CampaignsTable } from '@/components/campaigns/CampaignsTable';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';
import { StatCard } from '@/components/campaigns/StatCard';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { Eye, MousePointerClick, Percent, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: campaigns = [], isLoading } = useCampaigns();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const totalViews = campaigns.reduce((sum, c) => sum + c.total_views, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.total_clicks, 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';
  const totalPayout = campaigns.reduce((sum, c) => sum + c.estimated_payout, 0);

  const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your marketing campaigns
            </p>
          </div>
          <CreateCampaignDialog />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Views"
            value={formatNumber(totalViews)}
            icon={<Eye className="h-5 w-5" />}
          />
          <StatCard
            label="Total Clicks"
            value={formatNumber(totalClicks)}
            icon={<MousePointerClick className="h-5 w-5" />}
          />
          <StatCard
            label="Average CTR"
            value={`${avgCtr}%`}
            icon={<Percent className="h-5 w-5" />}
          />
          <StatCard
            label="Total Payout"
            value={formatCurrency(totalPayout)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        <CampaignsTable campaigns={campaigns} isLoading={isLoading} />
      </main>
    </div>
  );
}