import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CampaignEvent } from '@/hooks/useCampaigns';
import { format, startOfDay, subDays } from 'date-fns';

interface EventsChartProps {
  events: CampaignEvent[];
}

export function EventsChart({ events }: EventsChartProps) {
  const chartData = useMemo(() => {
    // Get last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: startOfDay(date).toISOString(),
        label: format(date, 'MMM d'),
        views: 0,
        clicks: 0,
      };
    });

    // Count events per day
    events.forEach((event) => {
      const eventDate = startOfDay(new Date(event.created_at)).toISOString();
      const day = days.find((d) => d.date === eventDate);
      if (day) {
        if (event.event_type === 'view') day.views++;
        else if (event.event_type === 'click') day.clicks++;
      }
    });

    return days;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border/50 shadow-card p-8 text-center">
        <p className="text-muted-foreground">No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-card p-6">
      <h3 className="font-medium mb-4">Events (Last 7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            <Bar
              dataKey="views"
              name="Views"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="clicks"
              name="Clicks"
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}