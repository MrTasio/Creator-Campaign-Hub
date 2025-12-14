import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useCreators, useCreateCampaign, useCreateCreator } from '@/hooks/useCampaigns';
import { Plus } from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  target_link: z.string().min(1, 'Target link is required').url('Invalid URL'),
  creator_id: z.string().min(1, 'Creator is required'),
  status: z.enum(['draft', 'active', 'completed']),
  cpm_rate: z.coerce.number().min(0),
  cpc_rate: z.coerce.number().min(0),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [showNewCreator, setShowNewCreator] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  
  const { data: creators = [] } = useCreators();
  const createCampaign = useCreateCampaign();
  const createCreator = useCreateCreator();
  
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      target_link: '',
      creator_id: '',
      status: 'draft',
      cpm_rate: 5,
      cpc_rate: 0.5,
    },
  });

  const onSubmit = async (data: CampaignFormData) => {
    await createCampaign.mutateAsync({
      name: data.name,
      target_link: data.target_link,
      creator_id: data.creator_id,
      status: data.status,
      cpm_rate: data.cpm_rate,
      cpc_rate: data.cpc_rate,
    });
    setOpen(false);
    form.reset();
  };

  const handleAddCreator = async () => {
    if (!newCreatorName.trim()) return;
    
    const result = await createCreator.mutateAsync({ name: newCreatorName.trim() });
    form.setValue('creator_id', result.id);
    setNewCreatorName('');
    setShowNewCreator(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          
        <div className="space-y-2">
            <Label htmlFor="name">Target Link</Label>
            <Input
              id="name"
              placeholder="https://www.example.com"
              {...form.register('target_link')}
            />
            {form.formState.errors.target_link && (
              <p className="text-sm text-destructive">{form.formState.errors.target_link.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              placeholder="Summer Product Launch"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Creator</Label>
            {!showNewCreator ? (
              <div className="flex gap-2">
                <Select
                  value={form.watch('creator_id')}
                  onValueChange={(value) => form.setValue('creator_id', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewCreator(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Creator name"
                  value={newCreatorName}
                  onChange={(e) => setNewCreatorName(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCreator}
                  disabled={createCreator.isPending}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewCreator(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            {form.formState.errors.creator_id && (
              <p className="text-sm text-destructive">{form.formState.errors.creator_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value: 'draft' | 'active' | 'completed') => form.setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpm_rate">CPM Rate ($)</Label>
              <Input
                id="cpm_rate"
                type="number"
                step="0.01"
                min="0"
                {...form.register('cpm_rate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpc_rate">CPC Rate ($)</Label>
              <Input
                id="cpc_rate"
                type="number"
                step="0.01"
                min="0"
                {...form.register('cpc_rate')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}