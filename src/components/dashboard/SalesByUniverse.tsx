import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from './ChartTooltip';
import { CATEGORICAL, formatCompactCurrency } from '@/lib/dashboard';

export interface UniverseSales {
  name: string;
  revenue: number;
  units: number;
}

interface SalesByUniverseProps {
  data: UniverseSales[];
}

export function SalesByUniverse({ data }: SalesByUniverseProps) {
  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Ventas por Universo</CardTitle>
        <CardDescription>Ingresos generados por cada universo de producto</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Sin datos en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              barCategoryGap={12}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                content={<ChartTooltip format="currency" />}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              />
              <Bar dataKey="revenue" name="Ingresos" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
