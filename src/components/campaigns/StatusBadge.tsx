import { cn } from '@/lib/utils';

type Status = 'draft' | 'active' | 'completed';

const statusStyles: Record<Status, string> = {
  draft: 'bg-status-draft/15 text-status-draft',
  active: 'bg-status-active/15 text-status-active',
  completed: 'bg-muted text-muted-foreground',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
      statusStyles[status],
      className
    )}>
      {status}
    </span>
  );
}