import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DepartmentData {
  name: string;
  orders: number;
  total: number;
}

interface TopDepartmentsProps {
  data: DepartmentData[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export function TopDepartments({ data }: TopDepartmentsProps) {
  const maxOrders = data[0]?.orders || 1;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Departamentos</CardTitle>
        <CardDescription>
          Los 10 departamentos con más compras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos de ventas</p>
          )}
          {data.map((dept, i) => (
            <div key={dept.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium truncate">{dept.name}</span>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {dept.orders} {dept.orders === 1 ? 'orden' : 'órdenes'} · {formatCurrency(dept.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(dept.orders / maxOrders) * 100}%` }}
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
