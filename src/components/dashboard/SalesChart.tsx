import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from './ChartTooltip';
import { REVENUE_COLOR, formatCompactCurrency } from '@/lib/dashboard';

interface SalesData {
  name: string;
  total: number;
}

interface SalesChartProps {
  data: SalesData[];
  year: number;
}

export function SalesChart({ data, year }: SalesChartProps) {
  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Ventas Mensuales</CardTitle>
        <CardDescription>Ingresos por mes durante {year}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip
              content={<ChartTooltip format="currency" />}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            />
            <Bar dataKey="total" name="Ingresos" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
