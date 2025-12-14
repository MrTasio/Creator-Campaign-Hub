import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-lg p-5 shadow-card border border-border/50',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className="text-muted-foreground/60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}