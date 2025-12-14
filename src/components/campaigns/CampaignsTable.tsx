import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Campaign } from '@/hooks/useCampaigns';
import { Eye, MousePointerClick, DollarSign, ChevronRight } from 'lucide-react';

interface CampaignsTableProps {
  campaigns: Campaign[];
  isLoading?: boolean;
}

export function CampaignsTable({ campaigns, isLoading }: CampaignsTableProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border/50 shadow-card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border/50 shadow-card p-12 text-center">
        <p className="text-muted-foreground">No campaigns yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-medium">Campaign</TableHead>
            <TableHead className="font-medium">Creator</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium text-right">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Views
              </span>
            </TableHead>
            <TableHead className="font-medium text-right">
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" /> Clicks
              </span>
            </TableHead>
            <TableHead className="font-medium text-right">CTR</TableHead>
            <TableHead className="font-medium text-right">
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Payout
              </span>
            </TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign.id}
              className="cursor-pointer group"
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            >
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.creators?.name || '—'}
              </TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(campaign.total_views)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(campaign.total_clicks)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {campaign.ctr.toFixed(2)}%
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(campaign.estimated_payout)}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}