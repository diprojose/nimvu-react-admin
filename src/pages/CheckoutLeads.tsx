import { useMemo, useState } from 'react';
import {
  useCheckoutLeads,
  useUpdateCheckoutLead,
  useDeleteCheckoutLead,
} from '@/hooks/useCheckoutLeads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  MoreHorizontal,
  Check,
  X,
  RotateCcw,
  Trash,
  ShoppingBag,
  Phone,
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboard';
import { buildWhatsappUrl, timeAgo, isFresh, leadDisplayName } from '@/lib/checkout-leads';
import type { CheckoutLead, CheckoutLeadStatus } from '@/types';

const STATUS_LABEL: Record<CheckoutLeadStatus, string> = {
  OPEN: 'Sin contactar',
  CONTACTED: 'Contactado',
  LOST: 'Perdido',
};

function StatusBadge({ lead }: { lead: CheckoutLead }) {
  if (lead.converted) {
    return <Badge className="bg-green-600 hover:bg-green-600">Compró</Badge>;
  }
  if (lead.status === 'CONTACTED') return <Badge variant="secondary">Contactado</Badge>;
  if (lead.status === 'LOST') return <Badge variant="outline">Perdido</Badge>;
  return <Badge variant="destructive">Sin contactar</Badge>;
}

export default function CheckoutLeads() {
  const [includeConverted, setIncludeConverted] = useState(false);
  const { data: leads, isLoading, error } = useCheckoutLeads(includeConverted);
  const updateLead = useUpdateCheckoutLead();
  const deleteLead = useDeleteCheckoutLead();
  const [detail, setDetail] = useState<CheckoutLead | undefined>();
  const [noteDraft, setNoteDraft] = useState('');

  const stats = useMemo(() => {
    const list = leads ?? [];
    const pendientes = list.filter((l) => !l.converted && l.status !== 'LOST');
    return {
      pendientes: pendientes.length,
      enJuego: pendientes.reduce((sum, l) => sum + (l.subtotal || 0), 0),
      recuperados: list.filter((l) => l.converted).length,
      sinContactar: pendientes.filter((l) => l.status === 'OPEN').length,
    };
  }, [leads]);

  const setStatus = (lead: CheckoutLead, status: CheckoutLeadStatus) =>
    updateLead.mutate({ id: lead.id, status });

  const openDetail = (lead: CheckoutLead) => {
    setDetail(lead);
    setNoteDraft(lead.note ?? '');
  };

  const saveNote = () => {
    if (!detail) return;
    updateLead.mutate(
      { id: detail.id, note: noteDraft },
      { onSuccess: () => setDetail(undefined) },
    );
  };

  if (isLoading) return <div>Cargando carritos abandonados...</div>;
  if (error) return <div>Error al cargar los carritos abandonados</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carritos Abandonados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clientes que llenaron el checkout y se fueron sin pagar. No son órdenes:
            no descuentan stock ni cuentan como ventas.
          </p>
        </div>
        <Button
          variant={includeConverted ? 'default' : 'outline'}
          onClick={() => setIncludeConverted((v) => !v)}
        >
          {includeConverted ? 'Ocultar recuperados' : 'Ver recuperados'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por trabajar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sinContactar} sin contactar todavía
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor en juego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.enJuego)}</div>
            <p className="text-xs text-muted-foreground">Subtotal, sin envío</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recuperados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {includeConverted ? stats.recuperados : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {includeConverted
                ? 'Abandonaron y terminaron comprando'
                : 'Activa "Ver recuperados"'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Carrito</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Abandonado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No hay carritos abandonados por ahora.
                </TableCell>
              </TableRow>
            )}
            {leads?.map((lead) => {
              const whatsapp = buildWhatsappUrl(lead);
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <button
                      className="text-left hover:underline"
                      onClick={() => openDetail(lead)}
                    >
                      <div className="font-medium">
                        {leadDisplayName(lead) || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </button>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.phone || lead.shippingAddress?.phone || (
                      <span className="text-muted-foreground italic">Sin teléfono</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {lead.items.map((i) => `${i.quantity}x ${i.name}`).join(', ') ||
                          '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(lead.subtotal)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {timeAgo(lead.capturedAt)}
                    {isFresh(lead) && (
                      <div className="text-xs text-amber-600">
                        puede seguir comprando
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge lead={lead} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {whatsapp ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 hover:text-green-800"
                          asChild
                          // Abrir el chat ya cuenta como contacto: se marca sin
                          // pedir un segundo click, que en la práctica nadie da.
                          onClick={() =>
                            lead.status === 'OPEN' && setStatus(lead, 'CONTACTED')
                          }
                        >
                          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                          <Phone className="h-3 w-3" /> sin número
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{STATUS_LABEL[lead.status]}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDetail(lead)}>
                            Ver detalle
                          </DropdownMenuItem>
                          {lead.status !== 'CONTACTED' && (
                            <DropdownMenuItem onClick={() => setStatus(lead, 'CONTACTED')}>
                              <Check className="h-4 w-4 mr-2" /> Marcar contactado
                            </DropdownMenuItem>
                          )}
                          {lead.status !== 'LOST' && (
                            <DropdownMenuItem onClick={() => setStatus(lead, 'LOST')}>
                              <X className="h-4 w-4 mr-2" /> Marcar perdido
                            </DropdownMenuItem>
                          )}
                          {lead.status !== 'OPEN' && (
                            <DropdownMenuItem onClick={() => setStatus(lead, 'OPEN')}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Reabrir
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('¿Eliminar este lead? No se puede deshacer.')) {
                                deleteLead.mutate(lead.id);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(detail && leadDisplayName(detail)) || 'Carrito abandonado'}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground text-xs">Correo</div>
                  <div className="break-all">{detail.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Teléfono</div>
                  <div>
                    {detail.phone || detail.shippingAddress?.phone || 'Sin teléfono'}
                  </div>
                </div>
              </div>

              {detail.shippingAddress && (
                <div>
                  <div className="text-muted-foreground text-xs">Dirección</div>
                  <div>
                    {[
                      detail.shippingAddress.address_1 || detail.shippingAddress.street,
                      detail.shippingAddress.city,
                      detail.shippingAddress.province || detail.shippingAddress.state,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              )}

              <div>
                <div className="text-muted-foreground text-xs mb-1">Carrito</div>
                <div className="space-y-1">
                  {detail.items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantId ?? idx}`}
                      className="flex items-start justify-between gap-3"
                    >
                      {/* min-w-0 es lo que deja encoger al texto: sin eso el
                          nombre no cede y se monta encima del precio. Se deja
                          envolver en vez de truncar porque en el detalle el
                          vendedor necesita leer qué producto es. */}
                      <span className="flex-1 min-w-0 break-words">
                        {item.quantity}x {item.name}
                        {item.variantName && (
                          <span className="text-muted-foreground"> ({item.variantName})</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-medium border-t mt-2 pt-2">
                  <span>Subtotal</span>
                  <span>{formatCurrency(detail.subtotal)}</span>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-xs" htmlFor="lead-note">
                  Nota interna
                </label>
                <textarea
                  id="lead-note"
                  className="mt-1 w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Qué pasó cuando lo contactaste..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetail(undefined)}>
                  Cerrar
                </Button>
                <Button onClick={saveNote} disabled={updateLead.isPending}>
                  Guardar nota
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
