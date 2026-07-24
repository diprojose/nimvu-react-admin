import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';
import { useProducts } from '@/hooks/useProducts';
import { useUniverses } from '@/hooks/useUniverses';
import { useExpenses } from '@/hooks/useExpenses';

import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { DonutChart, type DonutSlice } from '@/components/dashboard/DonutChart';
import { SalesByUniverse } from '@/components/dashboard/SalesByUniverse';
import { LowStockAlert, type LowStockItem } from '@/components/dashboard/LowStockAlert';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { UserRegistrationChart } from '@/components/dashboard/UserRegistrationChart';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { TopDepartments } from '@/components/dashboard/TopDepartments';

import {
  BLUE_RAMP,
  CATEGORICAL,
  PAYMENT_LABELS,
  PERIOD_LABELS,
  STATUS,
  STATUS_LABELS,
  delta,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  isCancelled,
  parseAddress,
  resolveRange,
  type PeriodKey,
} from '@/lib/dashboard';
import type { OrderItem } from '@/types';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const LOW_STOCK_THRESHOLD = 5;
const PERIODS: PeriodKey[] = ['7d', '30d', '90d', 'year', 'all'];

interface Bucket {
  name: string;
  start: Date;
  end: Date;
}

function buildBuckets(period: PeriodKey, now: Date, earliest: Date): Bucket[] {
  const buckets: Bucket[] = [];

  if (period === '7d' || period === '30d') {
    const days = period === '7d' ? 7 : 30;
    const first = startOfDay(addDays(now, -days + 1));
    for (let i = 0; i < days; i++) {
      const s = addDays(first, i);
      buckets.push({ name: format(s, 'd MMM', { locale: es }), start: s, end: addDays(s, 1) });
    }
  } else if (period === '90d') {
    const first = startOfDay(addDays(now, -7 * 13 + 1));
    for (let i = 0; i < 13; i++) {
      const s = addDays(first, i * 7);
      buckets.push({ name: format(s, 'd MMM', { locale: es }), start: s, end: addDays(s, 7) });
    }
  } else if (period === 'year') {
    const y = now.getFullYear();
    for (let m = 0; m < 12; m++) {
      buckets.push({ name: MONTHS[m], start: new Date(y, m, 1), end: new Date(y, m + 1, 1) });
    }
  } else {
    let s = startOfMonth(earliest);
    while (s <= now) {
      const e = addMonths(s, 1);
      buckets.push({ name: format(s, 'MMM yy', { locale: es }), start: s, end: e });
      s = e;
    }
    if (buckets.length === 0) {
      const s0 = startOfMonth(now);
      buckets.push({ name: format(s0, 'MMM yy', { locale: es }), start: s0, end: addMonths(s0, 1) });
    }
  }

  return buckets;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: users = [] } = useUsers();
  const { data: products = [] } = useProducts();
  const { data: universes = [] } = useUniverses();
  const { data: expenses = [] } = useExpenses();

  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => resolveRange(period, now), [period, now]);

  // --- Window filters ------------------------------------------------------
  const inCurrent = (d: Date) => (range.start ? d >= range.start : true);
  const inPrev = (d: Date) =>
    range.prevStart && range.prevEnd ? d >= range.prevStart && d < range.prevEnd : false;

  const validOrders = useMemo(() => orders.filter((o) => !isCancelled(o)), [orders]);

  const currentOrders = useMemo(
    () => validOrders.filter((o) => inCurrent(new Date(o.createdAt))),
    [validOrders, range],
  );
  const prevOrders = useMemo(
    () => validOrders.filter((o) => inPrev(new Date(o.createdAt))),
    [validOrders, range],
  );

  // --- KPI aggregates ------------------------------------------------------
  const revenue = useMemo(() => currentOrders.reduce((s, o) => s + o.total, 0), [currentOrders]);
  const prevRevenue = useMemo(() => prevOrders.reduce((s, o) => s + o.total, 0), [prevOrders]);

  const units = useMemo(
    () => currentOrders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0),
    [currentOrders],
  );
  const prevUnits = useMemo(
    () => prevOrders.reduce((s, o) => s + (o.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0),
    [prevOrders],
  );

  const aov = currentOrders.length ? revenue / currentOrders.length : 0;
  const prevAov = prevOrders.length ? prevRevenue / prevOrders.length : 0;

  const expensesCurrent = useMemo(
    () => expenses.filter((e) => inCurrent(new Date(e.date))).reduce((s, e) => s + e.amount, 0),
    [expenses, range],
  );
  const expensesPrev = useMemo(
    () => expenses.filter((e) => inPrev(new Date(e.date))).reduce((s, e) => s + e.amount, 0),
    [expenses, range],
  );

  const profit = revenue - expensesCurrent;
  const prevProfit = prevRevenue - expensesPrev;
  const margin = revenue ? (profit / revenue) * 100 : 0;

  const nonAdminUsers = useMemo(() => users.filter((u) => u.role !== 'ADMIN'), [users]);
  const newCustomers = useMemo(
    () => nonAdminUsers.filter((u) => inCurrent(new Date(u.createdAt))).length,
    [nonAdminUsers, range],
  );
  const prevNewCustomers = useMemo(
    () => nonAdminUsers.filter((u) => inPrev(new Date(u.createdAt))).length,
    [nonAdminUsers, range],
  );

  const activeProducts = useMemo(() => products.filter((p) => p.isActive !== false).length, [products]);

  // --- Low stock -----------------------------------------------------------
  const lowStock = useMemo<LowStockItem[]>(() => {
    const items: LowStockItem[] = [];
    products.forEach((p) => {
      if (p.isActive === false) return;
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          if (v.stock <= LOW_STOCK_THRESHOLD) {
            items.push({ id: v.id, name: p.name, variant: v.name, stock: v.stock });
          }
        });
      } else if (p.stock <= LOW_STOCK_THRESHOLD) {
        items.push({ id: p.id, name: p.name, stock: p.stock });
      }
    });
    return items.sort((a, b) => a.stock - b.stock).slice(0, 8);
  }, [products]);

  const lowStockCount = useMemo(() => {
    let count = 0;
    products.forEach((p) => {
      if (p.isActive === false) return;
      if (p.variants && p.variants.length > 0) {
        count += p.variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD).length;
      } else if (p.stock <= LOW_STOCK_THRESHOLD) {
        count += 1;
      }
    });
    return count;
  }, [products]);

  // --- Time series (revenue vs expenses + sparklines) ----------------------
  const timeline = useMemo(() => {
    const dates = [
      ...validOrders.map((o) => new Date(o.createdAt)),
      ...expenses.map((e) => new Date(e.date)),
    ];
    const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : now;
    const buckets = buildBuckets(period, now, earliest);

    const rows = buckets.map((b) => ({ name: b.name, ingresos: 0, gastos: 0, orders: 0, units: 0 }));

    const findIdx = (d: Date) => buckets.findIndex((b) => d >= b.start && d < b.end);

    validOrders.forEach((o) => {
      const idx = findIdx(new Date(o.createdAt));
      if (idx >= 0) {
        rows[idx].ingresos += o.total;
        rows[idx].orders += 1;
        rows[idx].units += o.items?.reduce((a, i) => a + i.quantity, 0) || 0;
      }
    });
    expenses.forEach((e) => {
      const idx = findIdx(new Date(e.date));
      if (idx >= 0) rows[idx].gastos += e.amount;
    });

    return rows;
  }, [validOrders, expenses, period, now]);

  const revenueSpark = timeline.map((r) => r.ingresos);
  const ordersSpark = timeline.map((r) => r.orders);
  const unitsSpark = timeline.map((r) => r.units);
  const aovSpark = timeline.map((r) => (r.orders ? r.ingresos / r.orders : 0));

  // --- Order status donut --------------------------------------------------
  const statusData = useMemo<DonutSlice[]>(() => {
    const order: Array<keyof typeof STATUS_LABELS> = [
      'PENDING',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
    ];
    const counts: Record<string, number> = {};
    orders
      .filter((o) => inCurrent(new Date(o.createdAt)))
      .forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });
    const slices: DonutSlice[] = order
      .map((s, i) => ({ name: STATUS_LABELS[s], value: counts[s] || 0, color: BLUE_RAMP[i] }))
      .filter((s) => s.value > 0);
    if (counts.CANCELLED) {
      slices.push({ name: STATUS_LABELS.CANCELLED, value: counts.CANCELLED, color: STATUS.critical });
    }
    return slices;
  }, [orders, range]);

  const totalStatusOrders = statusData.reduce((s, d) => s + d.value, 0);

  // --- Payment method donut (by revenue) -----------------------------------
  const paymentData = useMemo<DonutSlice[]>(() => {
    const map: Record<string, number> = {};
    currentOrders.forEach((o) => {
      const key = o.paymentMethod || 'WOMPI';
      map[key] = (map[key] || 0) + o.total;
    });
    return Object.entries(map)
      .map(([key, value], i) => ({
        name: PAYMENT_LABELS[key] || key,
        value,
        color: CATEGORICAL[i % CATEGORICAL.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentOrders]);

  // --- Sales by universe ---------------------------------------------------
  const universeById = useMemo(() => {
    const m: Record<string, string> = {};
    universes.forEach((u) => (m[u.id] = u.name));
    return m;
  }, [universes]);

  const productUniverse = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    products.forEach((p) => (m[p.id] = p.universeId || (p.universe && p.universe.id) || undefined));
    return m;
  }, [products]);

  const universeSales = useMemo(() => {
    const map: Record<string, { revenue: number; units: number }> = {};
    currentOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const uid = productUniverse[item.productId];
        const uname = (uid && universeById[uid]) || 'Sin universo';
        if (!map[uname]) map[uname] = { revenue: 0, units: 0 };
        map[uname].revenue += item.price * item.quantity;
        map[uname].units += item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [currentOrders, productUniverse, universeById]);

  // --- Top products / departments (windowed) -------------------------------
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sold: number; revenue: number; variants: Record<string, number> }> = {};
    currentOrders.forEach((o) => {
      o.items?.forEach((item: OrderItem) => {
        const id = item.productId;
        const name = item.product?.name || 'Producto desconocido';
        if (!map[id]) map[id] = { name, sold: 0, revenue: 0, variants: {} };
        map[id].sold += item.quantity;
        map[id].revenue += item.price * item.quantity;
        const vName = item.variantName || item.variant?.name;
        if (vName) map[id].variants[vName] = (map[id].variants[vName] || 0) + item.quantity;
      });
    });
    return Object.values(map)
      .map((p) => ({
        name: p.name,
        sold: p.sold,
        revenue: p.revenue,
        variants: Object.entries(p.variants)
          .map(([name, sold]) => ({ name, sold }))
          .sort((a, b) => b.sold - a.sold),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
  }, [currentOrders]);

  const topDepartments = useMemo(() => {
    const map: Record<string, { orders: number; total: number }> = {};
    currentOrders.forEach((o) => {
      const addr = parseAddress(o);
      if (!addr) return;
      const dept = (addr.province || addr.state || '').trim();
      if (!dept) return;
      if (!map[dept]) map[dept] = { orders: 0, total: 0 };
      map[dept].orders += 1;
      map[dept].total += o.total;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [currentOrders]);

  // --- Independent panels ---------------------------------------------------
  const salesData = useMemo(() => {
    const year = now.getFullYear();
    const monthly = new Array(12).fill(0);
    validOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year) monthly[d.getMonth()] += o.total;
    });
    return MONTHS.map((name, i) => ({ name, total: monthly[i] }));
  }, [validOrders, now]);

  const userStats = useMemo(() => {
    const stats: { name: string; users: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = users.filter((u) => {
        const ud = new Date(u.createdAt);
        return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
      }).length;
      stats.push({ name: MONTHS[d.getMonth()], users: count });
    }
    return stats;
  }, [users, now]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8),
    [orders],
  );

  const periodHint = PERIOD_LABELS[period].toLowerCase();
  const bucketHint =
    period === 'year' || period === 'all' ? 'por mes' : period === '90d' ? 'por semana' : 'por día';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen del rendimiento de tu tienda.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                period === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos"
          value={formatCurrency(revenue)}
          icon={DollarSign}
          delta={delta(revenue, prevRevenue)}
          hint={`${currentOrders.length} órdenes`}
          spark={revenueSpark}
          accent="#2a78d6"
        />
        <StatCard
          title="Órdenes"
          value={formatNumber(currentOrders.length)}
          icon={ShoppingCart}
          delta={delta(currentOrders.length, prevOrders.length)}
          hint={periodHint}
          spark={ordersSpark}
          accent="#008300"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(aov)}
          icon={Receipt}
          delta={delta(aov, prevAov)}
          hint="por orden"
          spark={aovSpark}
          accent="#4a3aa7"
        />
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency(profit)}
          icon={TrendingUp}
          delta={delta(profit, prevProfit)}
          hint={`margen ${margin.toFixed(0)}%`}
          accent={profit >= 0 ? '#0ca30c' : '#d03b3b'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unidades Vendidas"
          value={formatNumber(units)}
          icon={Boxes}
          delta={delta(units, prevUnits)}
          hint={periodHint}
          spark={unitsSpark}
          accent="#eb6834"
        />
        <StatCard
          title="Clientes Nuevos"
          value={formatNumber(newCustomers)}
          icon={Users}
          delta={delta(newCustomers, prevNewCustomers)}
          hint={periodHint}
          accent="#e87ba4"
        />
        <StatCard
          title="Productos Activos"
          value={formatNumber(activeProducts)}
          icon={Package}
          hint={`de ${products.length} totales`}
          accent="#256abf"
        />
        <StatCard
          title="Alertas de Stock"
          value={formatNumber(lowStockCount)}
          icon={AlertTriangle}
          hint="productos por reponer"
          accent="#fab219"
        />
      </div>

      {/* Trend + order status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <RevenueExpenseChart data={timeline} description={`${PERIOD_LABELS[period]} · ${bucketHint}`} />
        <DonutChart
          title="Estado de Órdenes"
          description="Distribución de órdenes por estado"
          data={statusData}
          centerLabel={formatNumber(totalStatusOrders)}
          centerHint="órdenes"
          format="number"
        />
      </div>

      {/* Universe + payment */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <SalesByUniverse data={universeSales} />
        <DonutChart
          title="Métodos de Pago"
          description="Ingresos por canal de pago"
          data={paymentData}
          centerLabel={formatCompactCurrency(revenue)}
          centerHint="total"
          format="currency"
        />
      </div>

      {/* Top products + departments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <TopProducts data={topProducts} />
        <TopDepartments data={topDepartments} />
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <RecentOrders orders={ordersLoading ? [] : recentOrders} />
        <LowStockAlert items={lowStock} threshold={LOW_STOCK_THRESHOLD} />
      </div>

      {/* Seasonal + user growth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <SalesChart data={salesData} year={now.getFullYear()} />
        <UserRegistrationChart data={userStats} />
      </div>
    </div>
  );
}
