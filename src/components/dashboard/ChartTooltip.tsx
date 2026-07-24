import { formatCurrency, formatNumber } from '@/lib/dashboard';

/** Minimal shape of a recharts tooltip payload entry that we consume. */
interface TooltipEntry {
  value: number;
  name?: string;
  color?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  /** How to format each value. */
  format?: 'currency' | 'number';
}

/** Shared, theme-aware tooltip for recharts charts in the dashboard. */
export function ChartTooltip({ active, payload, label, format = 'currency' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const fmt = format === 'currency' ? formatCurrency : formatNumber;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="mb-1 font-medium text-popover-foreground">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill }}
              />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums text-popover-foreground">
              {fmt(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
