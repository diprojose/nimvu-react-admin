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
import { MoreHorizontal, Eye, Trash, Copy, Plus, Download } from "lucide-react";
import { useState, useMemo } from 'react';
import { useOrders, useUpdateOrder, useDeleteOrder } from '@/hooks/useOrders';
import ManualOrderForm from '@/components/orders/ManualOrderForm';
import * as XLSX from 'xlsx';

import type { OrderStatus } from '@/types';
import { format, isToday, isThisWeek, isThisMonth, isThisYear, parseISO } from 'date-fns';
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

const PAYMENT_LABELS: Record<string, string> = {
  WOMPI: 'Wompi',
  CASH_ON_DELIVERY: 'Contra Entrega',
  WHATSAPP: 'WhatsApp',
};

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todo',
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
};

export default function Orders() {
  const { data: orders = [], isLoading, error } = useOrders();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    return orders.filter((order) => {
      const date = parseISO(order.createdAt);
      if (dateFilter === 'today') return isToday(date);
      if (dateFilter === 'week') return isThisWeek(date, { locale: es });
      if (dateFilter === 'month') return isThisMonth(date);
      if (dateFilter === 'year') return isThisYear(date);
      return true;
    });
  }, [orders, dateFilter]);

  // Totales del período filtrado
  const periodTotal = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + o.total, 0),
    [filteredOrders]
  );

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
    setIsDetailOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') {
      try { address = JSON.parse(address); } catch { return address; }
    }
    if (address.address_1 || address.city || address.province) {
      return [address.address_1, address.city, address.province, address.postal_code, address.country_code?.toUpperCase()]
        .filter(Boolean).join(', ');
    }
    if (address.street) {
      return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
    }
    return 'Dirección inválida';
  };

  const handleExportExcel = () => {
    const rows = filteredOrders.map((order) => {
      const addr = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress) : order.shippingAddress;
      return {
        'ID': order.id.slice(0, 8),
        'Cliente': order.user?.name || 'N/A',
        'Email': order.user?.email || 'N/A',
        'Teléfono': addr?.phone || 'N/A',
        'Fecha': format(parseISO(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }),
        'Estado': STATUS_LABELS[order.status],
        'Método de Pago': PAYMENT_LABELS[order.paymentMethod || ''] || order.paymentMethod || 'N/A',
        'Dirección': formatAddress(order.shippingAddress),
        'Productos': order.items?.map((i: any) =>
          `${i.product?.name || 'Producto'} x${i.quantity}`
        ).join(' | ') || '',
        'Envío': addr?.shippingCost || 0,
        'Total (COP)': order.total,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 40 },
      { wch: 50 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Órdenes');
    const label = DATE_FILTER_LABELS[dateFilter].replace(/ /g, '_');
    XLSX.writeFile(wb, `ordenes_${label}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) return <div>Cargando ordenes...</div>;

  if (error) {
    const user = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user;
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        <h3 className="font-bold">Error al cargar ordenes</h3>
        <div className="mt-2 text-sm text-gray-600">
          <p>Current Role: <strong>{user?.role || 'No Role Found'}</strong></p>
          <p>User ID: {user?.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">Órdenes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={() => setIsManualOpen(true)} className="bg-black text-white hover:bg-gray-800 gap-2">
            <Plus className="h-4 w-4" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* ── FILTROS DE FECHA ── */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              dateFilter === key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {DATE_FILTER_LABELS[key]}
          </button>
        ))}

        {/* Resumen del período */}
        <div className="ml-auto flex items-center gap-4 text-sm text-gray-600">
          <span>
            <span className="font-semibold text-gray-900">{filteredOrders.length}</span> órdenes
          </span>
          <span>
            Total: <span className="font-semibold text-gray-900">{formatCurrency(periodTotal)}</span>
          </span>
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Dirección de Envío</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-10">
                  No hay órdenes para el período seleccionado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-xs font-mono">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.user?.name || 'Usuario'}</span>
                      <span className="text-xs text-muted-foreground">{order.user?.email || 'No email'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(order.createdAt), 'dd MMM yyyy', { locale: es })}
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
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.paymentMethod === 'WHATSAPP'
                        ? 'bg-green-100 text-green-700'
                        : order.paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {PAYMENT_LABELS[order.paymentMethod || ''] || order.paymentMethod || 'Web'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate" title={formatAddress(order.shippingAddress)}>
                    {formatAddress(order.shippingAddress)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── MODAL DETALLE ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
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
                    {format(parseISO(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
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
                    <p><strong>Canal:</strong> {PAYMENT_LABELS[selectedOrder.paymentMethod || ''] || selectedOrder.paymentMethod || 'N/A'}</p>
                    <p><strong>Ref. Pago:</strong> <span className="font-mono">{selectedOrder.paymentId || 'N/A'}</span></p>
                    {selectedOrder.shippingAddress?.notes && (
                      <p><strong>Notas:</strong> {selectedOrder.shippingAddress.notes}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Productos ({selectedOrder.items?.length || 0})</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Artículo</TableHead>
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
                              <img
                                src={item.variant?.images?.[0] || item.product?.images?.[0] || 'https://via.placeholder.com/40'}
                                alt="Producto"
                                className="w-10 h-10 object-cover rounded-md border"
                              />
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
                        const addrObj = typeof selectedOrder.shippingAddress === 'string'
                          ? JSON.parse(selectedOrder.shippingAddress) : selectedOrder.shippingAddress;
                        const shipCost = addrObj?.shippingCost || 0;
                        if (shipCost > 0) return (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={3} className="text-right text-gray-500">Envío cobrado</TableCell>
                            <TableCell className="text-right text-gray-500 font-semibold">{formatCurrency(shipCost)}</TableCell>
                          </TableRow>
                        );
                        return null;
                      })()}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end pt-2">
                  <p className="text-xl font-bold bg-gray-100 px-4 py-2 rounded-md">
                    Total Neto: {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL NUEVA ORDEN MANUAL ── */}
      <ManualOrderForm isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </div>
  );
}
