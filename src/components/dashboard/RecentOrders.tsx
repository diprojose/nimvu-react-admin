import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, STATUS_LABELS } from '@/lib/dashboard';
import type { Order, OrderStatus } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface RecentOrdersProps {
  orders: Order[];
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  PACKED: 'bg-teal-100 text-teal-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  const navigate = useNavigate();

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
        <CardDescription>Últimas 8 órdenes registradas</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Sin órdenes recientes</p>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate('/orders')}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{order.user?.name || 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(order.createdAt), "dd MMM · HH:mm", { locale: es })}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="w-24 flex-shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
