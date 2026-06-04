import { useState } from 'react';
import {
  useUniverses,
  useCreateUniverse,
  useUpdateUniverse,
  useDeleteUniverse,
} from '@/hooks/useUniverses';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Universe } from '@/types';
import { UniverseForm } from '@/components/universes/UniverseForm';
import { getUniverseIcon } from '@/lib/universe-icons';

export default function Universes() {
  const { data: universes, isLoading, error } = useUniverses();
  const createUniverse = useCreateUniverse();
  const updateUniverse = useUpdateUniverse();
  const deleteUniverse = useDeleteUniverse();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | undefined>(undefined);

  const handleSave = (values: any) => {
    if (editingUniverse) {
      updateUniverse.mutate(
        { id: editingUniverse.id, ...values },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingUniverse(undefined);
          },
        },
      );
    } else {
      createUniverse.mutate(values, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingUniverse(undefined);
        },
      });
    }
  };

  const openCreateModal = () => {
    setEditingUniverse(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (universe: Universe) => {
    setEditingUniverse(universe);
    setIsModalOpen(true);
  };

  const handleDelete = (universe: Universe) => {
    const count = universe.categories?.length ?? 0;
    const message =
      count > 0
        ? `Este universo tiene ${count} categoría(s). Reasignalas antes de borrarlo.`
        : '¿Eliminar este universo?';
    if (count > 0) {
      alert(message);
      return;
    }
    if (confirm(message)) {
      deleteUniverse.mutate(universe.id);
    }
  };

  if (isLoading) return <div>Cargando universos...</div>;
  if (error) return <div>Error al cargar universos</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Universos</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Crear Universo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colores</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Icono</TableHead>
              <TableHead>Categorías</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {universes?.map((universe) => (
              <TableRow key={universe.id}>
                <TableCell>
                  <div className="flex gap-1">
                    {[universe.primaryColor, universe.secondaryColor, universe.accentColor].map(
                      (color, i) =>
                        color ? (
                          <div
                            key={i}
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ) : null,
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{universe.name}</TableCell>
                <TableCell>
                  <code className="text-xs">{universe.slug}</code>
                </TableCell>
                <TableCell>
                  {(() => {
                    const Icon = getUniverseIcon(universe.icon);
                    return Icon ? (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: universe.secondaryColor || undefined,
                          color: universe.accentColor || undefined,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    );
                  })()}
                </TableCell>
                <TableCell>{universe.categories?.length ?? 0}</TableCell>
                <TableCell>{universe.order}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={universe.isActive ? 'default' : 'secondary'}>
                      {universe.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {universe.comingSoon && <Badge variant="outline">Pronto</Badge>}
                  </div>
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
                      <DropdownMenuItem onClick={() => openEditModal(universe)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(universe)}
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUniverse ? 'Editar Universo' : 'Crear Universo'}
            </DialogTitle>
          </DialogHeader>
          <UniverseForm
            initialData={editingUniverse}
            onSubmit={handleSave}
            isLoading={createUniverse.isPending || updateUniverse.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
