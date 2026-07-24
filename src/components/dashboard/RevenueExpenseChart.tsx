import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from './ChartTooltip';
import { EXPENSE_COLOR, REVENUE_COLOR, formatCompactCurrency } from '@/lib/dashboard';

export interface RevenuePoint {
  name: string;
  ingresos: number;
  gastos: number;
}

interface RevenueExpenseChartProps {
  data: RevenuePoint[];
  description: string;
}

export function RevenueExpenseChart({ data, description }: RevenueExpenseChartProps) {
  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-ingresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={REVENUE_COLOR} stopOpacity={0.35} />
                <stop offset="95%" stopColor={REVENUE_COLOR} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fill-gastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={EXPENSE_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={EXPENSE_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip content={<ChartTooltip format="currency" />} cursor={{ stroke: 'hsl(var(--border))' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke={REVENUE_COLOR}
              strokeWidth={2}
              fill="url(#fill-ingresos)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              name="Gastos"
              stroke={EXPENSE_COLOR}
              strokeWidth={2}
              fill="url(#fill-gastos)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
