import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { CARRIER_LABELS, buildWhatsappMessage, buildWaLink } from '@/lib/shipping';
import type { ShippingCarrier } from '@/types';

export interface ShippingDialogProps {
  /** Orden que se está despachando; null mantiene el diálogo cerrado. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any | null;
  saving: boolean;
  onClose: () => void;
  onSave: (values: { carrier: ShippingCarrier; tracking: string }) => void;
}

/**
 * Diálogo para registrar transportadora y número de guía.
 *
 * Vive en su propio componente a propósito. Antes el estado de estos dos campos
 * estaba en la página de Órdenes, así que cada tecla del número de guía
 * re-renderizaba la tabla entera —con su menú desplegable por fila— y escribir
 * se sentía congelado. Aquí el estado es local: al teclear solo se repinta el
 * diálogo.
 *
 * El padre lo monta con `key` por orden, así que los campos se inicializan solos
 * al abrirlo con otra orden. Eso evita tener que sincronizarlos con un efecto,
 * que dispara renders en cascada.
 */
export function ShippingDialog({ order, saving, onClose, onSave }: ShippingDialogProps) {
  const [carrier, setCarrier] = useState<ShippingCarrier | ''>(
    (order?.shippingCarrier as ShippingCarrier) || '',
  );
  const [tracking, setTracking] = useState<string>(order?.trackingNumber || '');
  const [copied, setCopied] = useState(false);

  const ready = !!carrier && !!tracking.trim();

  const message = () =>
    buildWhatsappMessage(
      order?.user?.name,
      order?.id ?? '',
      carrier as ShippingCarrier,
      tracking.trim(),
    );

  const handleCopy = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(message());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar al portapapeles.');
    }
  };

  const handleOpenWhatsapp = () => {
    if (!ready) return;
    const link = buildWaLink(order?.shippingAddress, message());
    if (!link) {
      alert('Esta orden no tiene un teléfono válido. Usa "Copiar mensaje" y pégalo en WhatsApp.');
      return;
    }
    window.open(link, '_blank');
  };

  const handleSave = () => {
    if (!ready) {
      alert('Selecciona transportadora y escribe el número de guía.');
      return;
    }
    onSave({ carrier: carrier as ShippingCarrier, tracking: tracking.trim() });
  };

  return (
    <Dialog open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {order?.trackingNumber ? 'Editar envío' : 'Agregar envío'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Transportadora</label>
            <Select
              value={carrier || undefined}
              onValueChange={(v) => setCarrier(v as ShippingCarrier)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona transportadora" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CARRIER_LABELS) as ShippingCarrier[]).map((key) => (
                  <SelectItem key={key} value={key}>{CARRIER_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Número de guía</label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Ej. 1234567890"
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500">
            Se enviará un correo al cliente con el número de guía y el enlace de seguimiento al guardar (si cambia).
          </p>

          {ready && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Mensaje para WhatsApp</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar mensaje
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleOpenWhatsapp}
                  className="gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShippingDialog;
