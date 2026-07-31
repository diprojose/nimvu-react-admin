import type {
  PostSaleFault,
  PostSaleShippingPayer,
  PostSaleStatus,
  PostSaleType,
} from '@/types';

export const POST_SALE_TYPE_LABELS: Record<PostSaleType, string> = {
  TRANSIT_DAMAGE: 'Llegó roto',
  CUSTOMER_DAMAGE: 'El cliente lo rompió',
  EXCHANGE: 'Cambio (color/modelo)',
  MISSING_ITEM: 'Faltante',
  OTHER: 'Otro',
};

export const POST_SALE_TYPE_COLORS: Record<PostSaleType, string> = {
  TRANSIT_DAMAGE: 'bg-orange-100 text-orange-800',
  CUSTOMER_DAMAGE: 'bg-rose-100 text-rose-800',
  EXCHANGE: 'bg-violet-100 text-violet-800',
  MISSING_ITEM: 'bg-amber-100 text-amber-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export const POST_SALE_FAULT_LABELS: Record<PostSaleFault, string> = {
  NIMVU: 'Nimvu / transportadora',
  CUSTOMER: 'Cliente',
  UNDEFINED: 'Sin definir',
};

export const POST_SALE_STATUS_LABELS: Record<PostSaleStatus, string> = {
  OPEN: 'Abierto',
  PREPARING: 'En preparación',
  SHIPPED: 'Enviado',
  RESOLVED: 'Resuelto',
  CANCELLED: 'Cancelado',
};

export const POST_SALE_STATUS_COLORS: Record<PostSaleStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export const POST_SALE_PAYER_LABELS: Record<PostSaleShippingPayer, string> = {
  NIMVU: 'Nimvu lo asume',
  CUSTOMER_TO_NIMVU: 'Cliente nos pagó a nosotros',
  CUSTOMER_TO_COURIER: 'Cliente le pagó al domiciliario',
};

/** Aclaración de a dónde fue la plata, para que no se confunda con ingreso. */
export const POST_SALE_PAYER_HINTS: Record<PostSaleShippingPayer, string> = {
  NIMVU: 'Es un costo para Nimvu',
  CUSTOMER_TO_NIMVU: 'Entra a la caja de Nimvu',
  CUSTOMER_TO_COURIER: 'No pasa por la caja de Nimvu',
};

/**
 * Responsable sugerido según el tipo de caso. Es solo un valor inicial:
 * Oriana puede cambiarlo siempre.
 */
export const SUGGESTED_FAULT: Record<PostSaleType, PostSaleFault> = {
  TRANSIT_DAMAGE: 'NIMVU',
  CUSTOMER_DAMAGE: 'CUSTOMER',
  EXCHANGE: 'CUSTOMER',
  MISSING_ITEM: 'NIMVU',
  OTHER: 'UNDEFINED',
};

/** Quién suele pagar el envío según quién tuvo la culpa. */
export const SUGGESTED_PAYER: Record<PostSaleFault, PostSaleShippingPayer | ''> = {
  NIMVU: 'NIMVU',
  CUSTOMER: 'CUSTOMER_TO_NIMVU',
  UNDEFINED: '',
};

export const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);
