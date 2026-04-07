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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Trash, Copy } from "lucide-react";
import { useState } from 'react';
import { useOrders, useUpdateOrder, useDeleteOrder } from '@/hooks/useOrders';

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
  const deleteOrder = useDeleteOrder();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrder.mutate({ id: orderId, status: newStatus });
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta orden?')) {
      deleteOrder.mutate(orderId);
    }
  };

  const navigateDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
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

    // Backend format: { address_1, city, province, postal_code, country_code, first_name, last_name }
    if (address.address_1 || address.city || address.province) {
      const parts = [
        address.address_1,
        address.city,
        address.province,
        address.postal_code,
        address.country_code?.toUpperCase(),
      ].filter(Boolean);
      return parts.join(', ');
    }

    // Legacy format: { street, city, state, zip, country }
    if (address.street) {
      return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
    }

    return 'Dirección inválida';
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
              <TableHead>Estado</TableHead>
              <TableHead>Dirección de Envío</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
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
                  {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: es })}
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
                <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Copiar ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigateDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de la Orden</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">ID de Orden</p>
                  <p className="font-mono text-xs">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium text-sm">
                    {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[selectedOrder.status as OrderStatus]}`}>
                      {STATUS_LABELS[selectedOrder.status as OrderStatus]}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-sm">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Datos del Cliente</h3>
                  <div className="text-sm flex flex-col gap-2">
                    <p><strong>Nombre:</strong> {selectedOrder.user?.name || 'Invitado/Anónimo'}</p>
                    <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {
                      selectedOrder.shippingAddress?.phone || 
                      (typeof selectedOrder.shippingAddress === 'string' ? JSON.parse(selectedOrder.shippingAddress)?.phone : 'N/A')
                    }</p>
                    <p><strong>Documento C.C:</strong> {selectedOrder.user?.taxId || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Información de Envío</h3>
                  <div className="text-sm flex flex-col gap-2">
                    <p><strong>Dirección:</strong> {
                      selectedOrder.shippingAddress?.address_1 || selectedOrder.shippingAddress?.street || 'N/A'
                    } {selectedOrder.shippingAddress?.address_2 ? `- ${selectedOrder.shippingAddress.address_2}` : ''}</p>
                    <p><strong>Ciudad/Dpto:</strong> {
                      selectedOrder.shippingAddress?.city || 'N/A'
                    }, {selectedOrder.shippingAddress?.province || selectedOrder.shippingAddress?.state || 'N/A'}</p>
                    <p><strong>ZIP:</strong> {selectedOrder.shippingAddress?.postal_code || selectedOrder.shippingAddress?.zip || 'N/A'}</p>
                    <p><strong>Método de Pago:</strong> {selectedOrder.paymentMethod === 'WOMPI' ? 'Pasarela Wompi' : 'Contra Entrega'}</p>
                    <p><strong>Ref. Pago:</strong> <span className="font-mono">{selectedOrder.paymentId || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Productos ({selectedOrder.items?.length || 0})</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Articulo</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">P.U.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <img src={item.variant?.images?.[0] || item.product?.images?.[0] || 'https://via.placeholder.com/40'} alt="Producto" className="w-10 h-10 object-cover rounded-md border" />
                              <div className="flex flex-col">
                                <span>{item.product?.name || 'Producto Desconocido'}</span>
                                {item.variant && <span className="text-xs text-gray-500">Var: {item.variant.name}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                      {(() => {
                         const addrObj = typeof selectedOrder.shippingAddress === 'string' ? JSON.parse(selectedOrder.shippingAddress) : selectedOrder.shippingAddress;
                         const shipCost = addrObj?.shippingCost || 0;
                         if (shipCost > 0) {
                           return (
                             <TableRow className="bg-gray-50">
                               <TableCell colSpan={3} className="text-right text-gray-500">Envío cobrado</TableCell>
                               <TableCell className="text-right text-gray-500 font-semibold">{formatCurrency(shipCost)}</TableCell>
                             </TableRow>
                           )
                         }
                         return null;
                      })()}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end pt-2">
                   <p className="text-xl font-bold bg-gray-100 px-4 py-2 rounded-md">Total Neto: {formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
