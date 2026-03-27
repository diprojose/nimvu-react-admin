import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Discount } from '@/types';
import { useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCollections } from '@/hooks/useCollections';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const discountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(), // Empty string handled as undefined/null in submit
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0, 'El valor debe ser positivo'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().min(0).optional(),
  productIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),
});

export type DiscountFormValues = z.infer<typeof discountSchema>;

interface DiscountFormProps {
  initialData?: Discount;
  onSubmit: (data: DiscountFormValues) => void;
  isLoading?: boolean;
}

export function DiscountForm({ initialData, onSubmit, isLoading }: DiscountFormProps) {
  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      startDate: '',
      endDate: '',
      isActive: true,
      usageLimit: 0,
      productIds: [],
      collectionIds: [],
    },
  });

  const { data: products } = useProducts();
  const { data: collections } = useCollections();

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        code: initialData.code || '',
        type: initialData.type,
        value: initialData.value,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        isActive: initialData.isActive,
        usageLimit: initialData.usageLimit || 0,
        productIds: initialData.products?.map(p => p.id) || [],
        collectionIds: initialData.collections?.map(c => c.id) || [],
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: DiscountFormValues) => {
    onSubmit(values);
  };

  const selectedProductIds = form.watch('productIds');
  const selectedCollectionIds = form.watch('collectionIds');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la campaña o descuento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="EJ: VERANO2024" {...field} />
                </FormControl>
                <FormDescription>Dejar vacío para aplicar automáticamente.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                <div className="space-y-0.5">
                  <FormLabel>Activo</FormLabel>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Descuento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                    <SelectItem value="FIXED">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Inicio</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Fin</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Límite de Uso (Opcional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0 para ilimitado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="productIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Productos Aplicables</FormLabel>
                <Select
                  onValueChange={(val) => {
                    const current = field.value || [];
                    if (!current.includes(val)) {
                      field.onChange([...current, val]);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar productos" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProductIds.map((id) => {
                    const product = products?.find((p) => p.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="pr-1">
                        {product?.name || id}
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() => {
                            field.onChange(field.value.filter((val) => val !== id));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="collectionIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colecciones Aplicables</FormLabel>
                <Select
                  onValueChange={(val) => {
                    const current = field.value || [];
                    if (!current.includes(val)) {
                      field.onChange([...current, val]);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar colecciones" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {collections?.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCollectionIds.map((id) => {
                    const collection = collections?.find((c) => c.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="pr-1">
                        {collection?.name || id}
                        <button
                          type="button"
                          className="ml-1 hover:text-destructive"
                          onClick={() => {
                            field.onChange(field.value.filter((val) => val !== id));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form >
  );
}
