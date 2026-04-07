import { useState } from 'react';
import { useShippingRates, useCreateShippingRate, useUpdateShippingRate, useDeleteShippingRate } from '@/hooks/useShippingRates';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash, Truck } from 'lucide-react';
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
import { ShippingRateForm, type ShippingRateFormValues } from '@/components/shipping/ShippingRateForm';
import type { ShippingRate } from '@/types';

export default function ShippingRates() {
  const { data: rates, isLoading, error } = useShippingRates();
  const createRate = useCreateShippingRate();
  const updateRate = useUpdateShippingRate();
  const deleteRate = useDeleteShippingRate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | undefined>(undefined);

  const handleSave = (values: ShippingRateFormValues) => {
    // Handle "empty_value" from select to make it empty string or undefined
    const cleanValues = {
      ...values,
      state: values.state === 'empty_value' ? '' : values.state,
      city: values.city === 'empty_value' ? '' : values.city,
    };

    if (editingRate) {
      updateRate.mutate({
        id: editingRate.id,
        ...cleanValues,
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingRate(undefined);
        }
      });
    } else {
      createRate.mutate(cleanValues, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingRate(undefined);
        }
      });
    }
  };

  const openCreateModal = () => {
    setEditingRate(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (rate: ShippingRate) => {
    setEditingRate(rate);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Cargando tarifas...</div>;
  if (error) return <div>Error al cargar tarifas</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tarifas de Envío</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Crear Tarifa
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ubicación</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates?.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {rate.country}
                      {rate.state ? ` > ${rate.state}` : ' > Todos'}
                      {rate.city ? ` > ${rate.city}` : (rate.state ? ' > Todas' : '')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  ${rate.price.toLocaleString()}
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
                      <DropdownMenuItem onClick={() => openEditModal(rate)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta tarifa?')) {
                            deleteRate.mutate(rate.id);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Editar Tarifa' : 'Crear Tarifa'}</DialogTitle>
          </DialogHeader>
          <ShippingRateForm
            key={editingRate?.id ?? 'new'}
            initialData={editingRate}
            onSubmit={handleSave}
            isLoading={createRate.isPending || updateRate.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
