import { SalesChart } from '@/components/dashboard/SalesChart';
import { UserRegistrationChart } from '@/components/dashboard/UserRegistrationChart';
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

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido al panel de administración de Nimvu.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SalesChart data={salesData} />
        <UserRegistrationChart data={userStats} />
      </div>
    </div>
  );
}
