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
import { useState } from 'react';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import type { User, Role } from '@/types';
import { useUpdateUserRole, useUpdateUserApproval } from '@/hooks/useUsers';

export default function Users() {
  const { data: users, isLoading, error } = useUsers();
  const { mutate: updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: updateUserApproval, isPending: isUpdatingApproval } = useUpdateUserApproval();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <div className="rounded-md border">
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
            {users?.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || 'Sin nombre'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
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
                      defaultValue={user.isB2BApproved ? "true" : "false"}
                      onValueChange={(value) => handleApprovalChange(user.id, value === "true")}
                      disabled={isUpdatingApproval}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
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
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
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
