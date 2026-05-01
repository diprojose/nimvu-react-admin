import { SalesChart } from '@/components/dashboard/SalesChart';
import { UserRegistrationChart } from '@/components/dashboard/UserRegistrationChart';
import { TopDepartments } from '@/components/dashboard/TopDepartments';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';
import { useMemo } from 'react';

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export default function Dashboard() {
  const { data: orders } = useOrders();
  const { data: users } = useUsers();

  const salesData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlySales = new Array(12).fill(0);

    orders?.forEach(order => {
      const date = new Date(order.createdAt);
      if (date.getFullYear() === currentYear && order.status !== 'CANCELLED') {
        monthlySales[date.getMonth()] += order.total;
      }
    });

    return MONTHS.map((name, index) => ({
      name,
      total: monthlySales[index]
    }));
  }, [orders]);

  const userStats = useMemo(() => {
    const stats = [];
    const today = new Date();

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();

      const count = users?.filter(user => {
        const uDate = new Date(user.createdAt);
        return uDate.getMonth() === monthIndex && uDate.getFullYear() === year;
      }).length || 0;

      stats.push({
        name: MONTHS[monthIndex],
        users: count
      });
    }

    return stats;
  }, [users]);

  const topDepartments = useMemo(() => {
    const deptMap: Record<string, { orders: number; total: number }> = {};

    orders?.forEach(order => {
      if (order.status === 'CANCELLED') return;
      const addr = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress;
      if (!addr) return;

      const dept = (addr.province || addr.state || '').trim();
      if (!dept) return;

      if (!deptMap[dept]) deptMap[dept] = { orders: 0, total: 0 };
      deptMap[dept].orders++;
      deptMap[dept].total += order.total;
    });

    return Object.entries(deptMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [orders]);

  const topProducts = useMemo(() => {
    const productMap: Record<string, {
      name: string;
      sold: number;
      revenue: number;
      variants: Record<string, number>;
    }> = {};

    orders?.forEach(order => {
      if (order.status === 'CANCELLED') return;
      order.items?.forEach((item: any) => {
        const productName = item.product?.name || 'Producto desconocido';
        const productId = item.productId;

        if (!productMap[productId]) {
          productMap[productId] = { name: productName, sold: 0, revenue: 0, variants: {} };
        }
        productMap[productId].sold += item.quantity;
        productMap[productId].revenue += item.price * item.quantity;

        const variantName = item.variantName || item.variant?.name;
        if (variantName) {
          productMap[productId].variants[variantName] =
            (productMap[productId].variants[variantName] || 0) + item.quantity;
        }
      });
    });

    return Object.values(productMap)
      .map(p => ({
        name: p.name,
        sold: p.sold,
        revenue: p.revenue,
        variants: Object.entries(p.variants)
          .map(([name, sold]) => ({ name, sold }))
          .sort((a, b) => b.sold - a.sold),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
  }, [orders]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido al panel de administración de Nimvu.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SalesChart data={salesData} />
        <UserRegistrationChart data={userStats} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <TopProducts data={topProducts} />
        <TopDepartments data={topDepartments} />
      </div>
    </div>
  );
}
