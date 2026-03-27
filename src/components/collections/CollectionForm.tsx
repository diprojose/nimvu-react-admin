import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormLabel,
  FormMessage,
  FormField,
  FormItem,
  FormDescription,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Collection } from '@/types';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { X, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

const collectionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  slug: z.string().min(1, 'El slug es requerido'),
  productIds: z.array(z.string()).default([]),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;

interface CollectionFormProps {
  initialData?: Collection;
  onSubmit: (data: CollectionFormValues) => void;
  isLoading?: boolean;
}

export function CollectionForm({ initialData, onSubmit, isLoading }: CollectionFormProps) {
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      image: '',
      isActive: true,
      slug: '',
      productIds: [],
    },
  });

  const { data: products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        image: initialData.image || '',
        isActive: initialData.isActive,
        slug: initialData.slug,
        productIds: initialData.products?.map(p => p.id) || [],
      });
    }
  }, [initialData, form]);

  // Auto-generate slug from name if slug is empty
  const nameValue = form.watch('name');
  useEffect(() => {
    if (!initialData && nameValue && !form.getValues('slug')) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      form.setValue('slug', slug);
    }
  }, [nameValue, initialData, form]);

  const handleAddProduct = () => {
    if (selectedProductId) {
      const currentIds = form.getValues('productIds');
      if (!currentIds.includes(selectedProductId)) {
        form.setValue('productIds', [...currentIds, selectedProductId]);
      }
      setSelectedProductId('');
    }
  };

  const handleRemoveProduct = (id: string) => {
    const currentIds = form.getValues('productIds');
    form.setValue('productIds', currentIds.filter(pid => pid !== id));
  };

  const selectedProductIds = form.watch('productIds');
  const selectedProducts = products?.filter(p => selectedProductIds.includes(p.id)) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la colección" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="slug-de-la-coleccion" {...field} />
              </FormControl>
              <FormDescription>Identificador único para la URL.</FormDescription>
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
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen Principal</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] || '')}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Productos en la Colección</Label>
          <div className="flex gap-2">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products?.filter(p => !selectedProductIds.includes(p.id)).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={handleAddProduct} disabled={!selectedProductId}>
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </div>

          <div className="border rounded-md p-2 space-y-2 max-h-[200px] overflow-y-auto">
            {selectedProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay productos seleccionados.</p>
            )}
            {selectedProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.name} className="h-8 w-8 rounded object-cover" />
                  )}
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveProduct(product.id)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
