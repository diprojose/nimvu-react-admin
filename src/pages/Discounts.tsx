import { useState } from 'react';
import { useDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount } from '@/hooks/useDiscounts';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash, TicketPercent } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { DiscountForm, type DiscountFormValues } from '@/components/discounts/DiscountForm';
import type { Discount } from '@/types';

export default function Discounts() {
  const { data: discounts, isLoading, error } = useDiscounts();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | undefined>(undefined);

  const handleSave = (values: DiscountFormValues) => {
    if (editingDiscount) {
      updateDiscount.mutate({
        id: editingDiscount.id,
        ...values,
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingDiscount(undefined);
        }
      });
    } else {
      createDiscount.mutate(values, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingDiscount(undefined);
        }
      });
    }
  };

  const openCreateModal = () => {
    setEditingDiscount(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Cargando descuentos...</div>;
  if (error) return <div>Error al cargar descuentos</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Descuentos</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Crear Descuento
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Validez</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts?.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <TicketPercent className="h-4 w-4 text-muted-foreground" />
                    {discount.name}
                  </div>
                </TableCell>
                <TableCell>
                  {discount.code ? (
                    <Badge variant="outline" className="font-mono">
                      {discount.code}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">Automático</span>
                  )}
                </TableCell>
                <TableCell>
                  {discount.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}
                </TableCell>
                <TableCell>
                  {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`}
                </TableCell>
                <TableCell>
                  <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                    {discount.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{new Date(discount.startDate).toLocaleDateString()}</div>
                  <div>at {new Date(discount.endDate).toLocaleDateString()}</div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditModal(discount)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este descuento?')) {
                            deleteDiscount.mutate(discount.id);
                          }
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'Editar Descuento' : 'Crear Descuento'}</DialogTitle>
          </DialogHeader>
          <DiscountForm
            initialData={editingDiscount}
            onSubmit={handleSave}
            isLoading={createDiscount.isPending || updateDiscount.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
