import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';

import type { OrderStatus } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En preparación',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  PROCESSING: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  SHIPPED: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  DELIVERED: 'bg-green-100 text-green-800 hover:bg-green-100',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export default function Orders() {
  const { data: orders, isLoading, error } = useOrders();
  const updateOrder = useUpdateOrder();

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrder.mutate({ id: orderId, status: newStatus });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (e) {
        return address;
      }
    }

    if (address.address_1 || address.city || address.province) {
      const parts = [address.address_1, address.province, address.city].filter(Boolean);
      return parts.join(', ');
    }

    if (address.street) {
      return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
    }

    return 'Dirección inválida';
  };

  const formatPhone = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (e) {
        return 'N/A';
      }
    }
    return address.phone || 'N/A';
  };

  const formatPaymentMethod = (method?: string) => {
    if (method === 'CASH_ON_DELIVERY') return 'Pago contra entrega';
    return method || 'N/A';
  };

  if (isLoading) {
    return <div>Cargando ordenes...</div>;
  }

  if (error) {
    const user = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user;
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        <h3 className="font-bold">Error al cargar ordenes</h3>
        <p>Status: 401 (Unauthorized)</p>
        <div className="mt-2 text-sm text-gray-600">
          <p>Debug Info:</p>
          <p>Current Role: <strong>{user?.role || 'No Role Found'}</strong></p>
          <p>User ID: {user?.id}</p>
          <p>Token Present: {!!localStorage.getItem('token') ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ordenes</h1>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Método de pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Dirección de Envío</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-xs font-mono">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.user?.name || 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground">{order.user?.email || 'No email'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), 'dd MMMM yyyy - h:mm a', { locale: es })}
                </TableCell>
                <TableCell>
                  {formatPaymentMethod(order.paymentMethod)}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={updateOrder.isPending}
                  >
                    <SelectTrigger className={`w-[150px] h-8 border-0 ${STATUS_COLORS[order.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={formatAddress(order.shippingAddress)}>
                  {formatAddress(order.shippingAddress)}
                </TableCell>
                <TableCell>
                  {formatPhone(order.shippingAddress)}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ver detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Productos de la orden {order.id.slice(0, 8)}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[60px]">Imagen</TableHead>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="text-right">Cantidad</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      {item.product?.images?.[0] ? (
                                        <div className="w-10 h-10 rounded overflow-hidden">
                                          <img
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                          <span>N/A</span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{item.product?.name || `Product ID: ${item.productId}`}</span>
                                        {item.variant && (
                                          <span className="text-xs text-muted-foreground">{item.variant.name}</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center">No hay productos registrados en esta orden.</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
