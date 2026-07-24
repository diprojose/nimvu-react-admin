import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /** Period-over-period change in %. null = no comparison available. */
  delta?: number | null;
  /** Small context line under the value. */
  hint?: string;
  /** Optional sparkline series (one number per bucket). */
  spark?: number[];
  /** When true, a positive delta is bad (e.g. cancellations). Inverts colors. */
  invertDelta?: boolean;
  /** Accent color for icon + sparkline. Defaults to primary ink. */
  accent?: string;
}

const fmtDelta = (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`;

export function StatCard({
  title,
  value,
  icon: Icon,
  delta,
  hint,
  spark,
  invertDelta = false,
  accent = 'hsl(var(--primary))',
}: StatCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;
  const neutral = delta === 0;

  const deltaColor = neutral
    ? 'text-muted-foreground'
    : good
    ? 'text-emerald-600'
    : 'text-red-600';
  const DeltaIcon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  const sparkData = spark?.map((v, i) => ({ i, v })) ?? [];
  const gradientId = `spark-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</div>

        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {hasDelta ? (
            <span className={`inline-flex items-center gap-0.5 font-medium ${deltaColor}`}>
              <DeltaIcon className="h-3.5 w-3.5" />
              {fmtDelta(delta as number)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {hint && <span className="text-muted-foreground truncate">{hint}</span>}
        </div>

        {spark && spark.length > 1 && (
          <div className="mt-3 h-10 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
