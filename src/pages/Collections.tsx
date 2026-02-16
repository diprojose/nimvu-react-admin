import { useCollections, useDeleteCollection, useCreateCollection, useUpdateCollection } from '@/hooks/useCollections';
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
} from "@/components/ui/dialog";
import { useState } from 'react';
import type { Collection } from '@/types';
import { CollectionForm } from '@/components/collections/CollectionForm';
import { Badge } from '@/components/ui/badge';

export default function Collections() {
  const { data: collections, isLoading, error } = useCollections();
  const deleteCollection = useDeleteCollection();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>(undefined);

  const handleSaveCollection = (values: any) => {
    if (editingCollection) {
      updateCollection.mutate({
        id: editingCollection.id,
        ...values,
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingCollection(undefined);
        }
      });
    } else {
      createCollection.mutate(values, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingCollection(undefined);
        }
      });
    }
  };

  const openCreateModal = () => {
    setEditingCollection(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Cargando colecciones...</div>;
  if (error) return <div>Error al cargar colecciones</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Colecciones</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Crear Colección
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections?.map((collection: Collection) => (
              <TableRow key={collection.id}>
                <TableCell>
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{collection.name}</TableCell>
                <TableCell>{collection.slug}</TableCell>
                <TableCell>{collection.products?.length || 0}</TableCell>
                <TableCell>
                  <Badge variant={collection.isActive ? 'default' : 'secondary'}>
                    {collection.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => openEditModal(collection)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta colección?')) {
                            deleteCollection.mutate(collection.id);
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? 'Editar Colección' : 'Crear Nueva Colección'}</DialogTitle>
          </DialogHeader>
          <CollectionForm
            initialData={editingCollection}
            onSubmit={handleSaveCollection}
            isLoading={createCollection.isPending || updateCollection.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
