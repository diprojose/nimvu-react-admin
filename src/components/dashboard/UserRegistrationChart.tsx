import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip } from './ChartTooltip';

interface UserData {
  name: string;
  users: number;
}

interface UserRegistrationChartProps {
  data: UserData[];
}

const USER_COLOR = '#4a3aa7';

export function UserRegistrationChart({ data }: UserRegistrationChartProps) {
  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Usuarios Nuevos</CardTitle>
        <CardDescription>Registros en los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-users" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={USER_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={USER_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              width={32}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip format="number" />} cursor={{ stroke: 'hsl(var(--border))' }} />
            <Area
              type="monotone"
              dataKey="users"
              name="Usuarios"
              stroke={USER_COLOR}
              strokeWidth={2}
              fill="url(#fill-users)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
