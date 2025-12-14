import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddManualEvent } from '@/hooks/useCampaigns';
import { Plus } from 'lucide-react';

interface ManualEventFormProps {
  campaignId: string;
}

export function ManualEventForm({ campaignId }: ManualEventFormProps) {
  const [eventType, setEventType] = useState<'view' | 'click'>('view');
  const [count, setCount] = useState('1');
  
  const addEvent = useAddManualEvent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numCount = parseInt(count, 10);
    if (numCount > 0 && numCount <= 1000) {
      addEvent.mutate({
        campaignId,
        eventType,
        count: numCount,
      });
      setCount('1');
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-card p-6">
      <h3 className="font-medium mb-4">Add Manual Events</h3>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select value={eventType} onValueChange={(v: 'view' | 'click') => setEventType(v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="click">Click</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Count</Label>
          <Input
            type="number"
            min="1"
            max="1000"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-24"
          />
        </div>
        <Button type="submit" disabled={addEvent.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </form>
    </div>
  );
}