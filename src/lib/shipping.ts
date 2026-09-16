import type { ShippingCarrier } from '@/types';

export const CARRIER_LABELS: Record<ShippingCarrier, string> = {
  ENVIA: 'Envía',
  SERVIENTREGA: 'Servientrega',
};

const CARRIER_TRACKING_URL: Record<ShippingCarrier, string> = {
  ENVIA: 'https://envia.co/',
  SERVIENTREGA: 'https://www.servientrega.com/wps/portal/rastreo-envio',
};

/** Aviso de despacho listo para pegar en WhatsApp. */
export const buildWhatsappMessage = (
  name: string | undefined,
  orderId: string,
  carrier: ShippingCarrier,
  tracking: string,
) => {
  const firstName = (name || '').split(' ')[0] || 'Hola';
  return `¡Hola ${firstName}! 👋

Tu pedido #${orderId.slice(0, 8)} de Nimvu ya está en camino 🚚

📦 Transportadora: ${CARRIER_LABELS[carrier]}
🔢 Número de guía: ${tracking}

Puedes hacer seguimiento aquí:
${CARRIER_TRACKING_URL[carrier]}

¡Gracias por elegir Nimvu! 💛`;
};

/** Número del cliente en formato wa.me, o null si la orden no trae teléfono. */
export const buildWaLink = (shippingAddress: unknown, message: string) => {
  const raw =
    typeof shippingAddress === 'string'
      ? (() => {
          try {
            return JSON.parse(shippingAddress);
          } catch {
            return {};
          }
        })()
      : shippingAddress || {};

  let phone = ((raw as { phone?: string }).phone || '').toString().replace(/\D/g, '');
  if (!phone) return null;
  if (phone.length === 10) phone = `57${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
