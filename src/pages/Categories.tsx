import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Category } from '@/types';
import { useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableTableRow({ category, openEditModal, handleDelete }: { category: Category, openEditModal: any, handleDelete: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-700 p-2 -ml-2">
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>{category.description}</TableCell>
      <TableCell>{category.order || 0}</TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image: z.string().optional(),
  order: z.number().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
  const { data: categories, isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Sync server data to local state for optimistic dragging
  useEffect(() => {
    if (categories) {
      const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
      setLocalCategories(sorted);
    }
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const oldIndex = localCategories.findIndex((c) => c.id === active.id);
      const newIndex = localCategories.findIndex((c) => c.id === over.id);
      
      const newOrderInfo = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newOrderInfo);

      const updatesPromises = newOrderInfo.map((cat, index) => {
        if (cat.order !== index) {
          return updateCategory.mutateAsync({ id: cat.id, order: index });
        }
        return null;
      }).filter(Boolean);

      try {
         await Promise.all(updatesPromises);
      } catch (error) {
         console.error('Error actualizando orden de categorías', error);
      }
    }
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      order: 0,
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...values }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingCategory(null);
          form.reset();
        }
      });
    } else {
      createCategory.mutate(values, {
        onSuccess: () => {
          setIsModalOpen(false);
          form.reset();
        }
      });
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      order: category.order || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      deleteCategory.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando categorías...</div>;
  if (error) return <div>Error al cargar categorías</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingCategory(null);
            form.reset({ name: '', description: '', image: '', order: 0 });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Crear Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Crear Categoría'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la categoría" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                    {editingCategory ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={localCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {localCategories.map((category) => (
                  <SortableTableRow 
                    key={category.id} 
                    category={category} 
                    openEditModal={openEditModal} 
                    handleDelete={handleDelete} 
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
