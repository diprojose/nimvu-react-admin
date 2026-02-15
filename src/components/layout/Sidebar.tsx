import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/categories', label: 'Categorías', icon: Tags },
  { href: '/orders', label: 'Ordenes', icon: ShoppingCart },
  { href: '/users', label: 'Usuarios', icon: Users },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuth((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold text-lg">Nimvu Admin</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
