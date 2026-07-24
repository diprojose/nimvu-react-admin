import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, PackageCheck } from 'lucide-react';
import { formatNumber } from '@/lib/dashboard';

export interface LowStockItem {
  id: string;
  name: string;
  variant?: string;
  stock: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
  /** Stock at or below this is "low". Used only for the color scale. */
  threshold: number;
}

export function LowStockAlert({ items, threshold }: LowStockAlertProps) {
  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas de Stock
        </CardTitle>
        <CardDescription>
          Productos con {threshold} unidades o menos disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <PackageCheck className="h-8 w-8 text-emerald-500" />
            Todo el inventario está en niveles saludables
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => {
              const critical = item.stock === 0;
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.variant && (
                      <p className="truncate text-xs text-muted-foreground">{item.variant}</p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                      critical
                        ? 'bg-red-100 text-red-700'
                        : item.stock <= threshold / 2
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {critical ? 'Agotado' : `${formatNumber(item.stock)} uds`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
