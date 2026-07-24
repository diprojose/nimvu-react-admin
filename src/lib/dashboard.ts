import type { Order, OrderStatus, ShippingAddress } from '@/types';

/** COP currency, no decimals. */
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

/** Compact currency for axis ticks / tight spaces: $1.2M, $850K. */
export const formatCompactCurrency = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-CO').format(Math.round(n || 0));

export const formatPercent = (n: number, digits = 1) =>
  `${n >= 0 ? '' : ''}${n.toFixed(digits)}%`;

/**
 * Validated categorical palette (dataviz skill, default 4-slot — passes
 * all-pairs CVD + normal-vision floors on the light surface). Fixed order:
 * hues follow the entity, never its rank.
 */
export const CATEGORICAL = ['#2a78d6', '#008300', '#e87ba4', '#eda100'] as const;

/** Ordinal blue ramp for pipeline stages (order status funnel). */
export const BLUE_RAMP = ['#86b6ef', '#5598e7', '#3987e5', '#256abf', '#184f95'] as const;

/** Reserved status colors — never reused as a series hue. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

export const REVENUE_COLOR = '#2a78d6';
export const EXPENSE_COLOR = '#d03b3b';

export type PeriodKey = '7d' | '30d' | '90d' | 'year' | 'all';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  year: 'Este año',
  all: 'Todo',
};

export interface DateRange {
  /** Start of the current window (inclusive). null = beginning of time. */
  start: Date | null;
  /** Start of the comparison window (inclusive). null = no comparison. */
  prevStart: Date | null;
  /** End of the comparison window / start of current (exclusive on prev). */
  prevEnd: Date | null;
}

/**
 * Resolves a period key into the current window and the immediately-preceding
 * window of equal length, used for period-over-period deltas.
 */
export function resolveRange(period: PeriodKey, now = new Date()): DateRange {
  if (period === 'all') {
    return { start: null, prevStart: null, prevEnd: null };
  }

  if (period === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    return { start, prevStart, prevEnd: start };
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, prevStart, prevEnd: start };
}

/** Percentage change from `prev` to `curr`. null when prev is 0 (undefined). */
export function delta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

export const isCancelled = (o: Pick<Order, 'status'>) => o.status === 'CANCELLED';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En preparación',
  PACKED: 'Empacado',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const PAYMENT_LABELS: Record<string, string> = {
  WOMPI: 'Wompi',
  CASH_ON_DELIVERY: 'Contra entrega',
  WHATSAPP: 'WhatsApp',
  MERCADO_LIBRE: 'Mercado Libre',
};

/** Safely parse an order's shippingAddress (stored as JSON or string). */
export function parseAddress(order: Order): ShippingAddress | null {
  const addr = order.shippingAddress;
  if (!addr) return null;
  if (typeof addr === 'string') {
    try {
      return JSON.parse(addr) as ShippingAddress;
    } catch {
      return null;
    }
  }
  return addr as ShippingAddress;
}
