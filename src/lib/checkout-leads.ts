import type { CheckoutLead } from '@/types';

/**
 * Normaliza a formato internacional para wa.me. Los clientes escriben el
 * celular de muchas formas ("300 123 4567", "+57 300...", "57300..."), y wa.me
 * solo acepta dígitos con indicativo de país.
 */
export function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  // Cualquier otra longitud es un dato sucio: mejor no ofrecer el botón que
  // abrir un chat con un número equivocado.
  return null;
}

const firstName = (lead: CheckoutLead) =>
  (lead.name || lead.shippingAddress?.name || '').trim().split(/\s+/)[0] || '';

/** Mensaje prellenado. El vendedor lo puede editar antes de enviarlo. */
export function buildWhatsappMessage(lead: CheckoutLead): string {
  const saludo = firstName(lead) ? `Hola ${firstName(lead)}` : 'Hola';
  const productos = lead.items
    .map((i) => `${i.quantity}x ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
    .join(', ');

  return (
    `${saludo}, te escribimos de Nimvu 🖨️\n\n` +
    (productos ? `Vimos que dejaste esto en tu carrito: ${productos}.\n\n` : '') +
    `¿Te quedó alguna duda con el envío o el pago? Con gusto te ayudamos a completar tu pedido.`
  );
}

/** null si el teléfono no sirve: la vista esconde el botón en ese caso. */
export function buildWhatsappUrl(lead: CheckoutLead): string | null {
  const phone = normalizePhone(lead.phone || lead.shippingAddress?.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(lead))}`;
}

/** "hace 2 h", "hace 3 d" — para saber qué tan frío está el lead. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString('es-CO');
}

/**
 * Un lead recién capturado suele seguir en el checkout: escribirle de una es
 * invasivo y además puede que compre solo. Se marcan aparte para que el
 * vendedor priorice los que ya se enfriaron.
 */
export const FRESH_MINUTES = 30;

export const isFresh = (lead: CheckoutLead) =>
  Date.now() - new Date(lead.capturedAt).getTime() < FRESH_MINUTES * 60_000;
