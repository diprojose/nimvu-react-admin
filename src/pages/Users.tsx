import { useUsers } from '@/hooks/useUsers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import type { User, Role } from '@/types';
import { useUpdateUserRole, useUpdateUserApproval } from '@/hooks/useUsers';
import { format, isToday, isThisWeek, isThisMonth, isThisYear, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todo',
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
};

const ROLE_COLORS: Record<Role, string> = {
  USER: 'bg-gray-100 text-gray-700',
  B2B: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-purple-100 text-purple-700',
};

export default function Users() {
  const { data: users = [], isLoading, error } = useUsers();
  const { mutate: updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: updateUserApproval, isPending: isUpdatingApproval } = useUpdateUserApproval();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredUsers = useMemo(() => {
    if (dateFilter === 'all') return users;
    return users.filter((user: User) => {
      const date = parseISO(user.createdAt);
      if (dateFilter === 'today') return isToday(date);
      if (dateFilter === 'week') return isThisWeek(date, { locale: es });
      if (dateFilter === 'month') return isThisMonth(date);
      if (dateFilter === 'year') return isThisYear(date);
      return true;
    });
  }, [users, dateFilter]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    updateUserRole({ id: userId, role: newRole });
  };

  const handleApprovalChange = (userId: string, isApproved: boolean) => {
    updateUserApproval({ id: userId, isB2BApproved: isApproved });
  };

  if (isLoading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error al cargar usuarios</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {/* ── FILTROS DE FECHA ── */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              dateFilter === key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {DATE_FILTER_LABELS[key]}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filteredUsers.length}</span> usuarios
        </span>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Aprobado (B2B)</TableHead>
              <TableHead>Fecha Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                  No hay usuarios registrados en este período
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || 'Sin nombre'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                      disabled={isUpdatingRole}
                    >
                      <SelectTrigger className={`w-28 h-7 text-xs border-0 font-medium ${ROLE_COLORS[user.role]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.role === 'B2B' ? (
                      <Select
                        defaultValue={user.isB2BApproved ? 'true' : 'false'}
                        onValueChange={(value) => handleApprovalChange(user.id, value === 'true')}
                        disabled={isUpdatingApproval}
                      >
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-gray-400 text-sm italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(parseISO(user.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
