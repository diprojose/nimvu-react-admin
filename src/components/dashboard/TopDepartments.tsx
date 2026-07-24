import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from '@/lib/dashboard';

interface DepartmentData {
  name: string;
  orders: number;
  total: number;
}

interface TopDepartmentsProps {
  data: DepartmentData[];
}

export function TopDepartments({ data }: TopDepartmentsProps) {
  const maxOrders = data[0]?.orders || 1;

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Top Departamentos</CardTitle>
        <CardDescription>
          Los 10 departamentos con más compras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ventas</p>
          )}
          {data.map((dept, i) => (
            <div key={dept.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium truncate">{dept.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0 tabular-nums">
                    {dept.orders} {dept.orders === 1 ? 'orden' : 'órdenes'} · {formatCurrency(dept.total)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(dept.orders / maxOrders) * 100}%`, backgroundColor: '#008300' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
