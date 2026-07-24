import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from './ChartTooltip';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  description: string;
  data: DonutSlice[];
  /** Big number rendered in the donut hole. */
  centerLabel: string;
  centerHint?: string;
  /** How the legend + tooltip format the slice values. */
  format?: 'currency' | 'number';
  className?: string;
}

export function DonutChart({
  title,
  description,
  data,
  centerLabel,
  centerHint,
  format = 'number',
  className = 'col-span-full lg:col-span-3',
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const nf = new Intl.NumberFormat('es-CO');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Sin datos en este período</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[180px] w-[180px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {data.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={format} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums leading-none">{centerLabel}</span>
                {centerHint && (
                  <span className="mt-1 text-xs text-muted-foreground">{centerHint}</span>
                )}
              </div>
            </div>

            <ul className="flex-1 space-y-2 self-stretch">
              {data.map((slice) => {
                const pct = total ? (slice.value / total) * 100 : 0;
                return (
                  <li key={slice.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="flex-1 truncate text-muted-foreground">{slice.name}</span>
                    <span className="font-medium tabular-nums">{nf.format(slice.value)}</span>
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
