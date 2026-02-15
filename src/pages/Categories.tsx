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

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
  const { data: categories, isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
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
            form.reset({ name: '', description: '', image: '' });
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
