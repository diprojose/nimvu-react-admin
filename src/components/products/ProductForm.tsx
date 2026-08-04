import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormLabel,
  FormMessage,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Trash, Plus, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCategories } from '@/hooks/useCategories';
import { useUniverses } from '@/hooks/useUniverses';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nombre de variante requerido'),
  sku: z.string().min(1, 'SKU requerido'),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string()).default([]),
});

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.coerce.number().int().min(0, 'El stock debe ser un entero positivo'),
  images: z.array(z.string()).default([]),
  height: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  length: z.coerce.number().min(0).optional(),
  longDescription: z.string().optional(),
  universeId: z.string().min(1, 'El universo es requerido'),
  categoryId: z.string().optional(),
  isB2BOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).default([]),
  // Precio promocional temporal. Se guarda como texto porque el input debe
  // poder quedar vacío: con z.coerce.number() un campo en blanco se volvería 0
  // y parecería una promoción de $0. La conversión ocurre al guardar.
  discountPrice: z.string().optional(),
  discountEndDate: z.string().optional(),
})
  .refine((d) => !d.discountPrice || Number(d.discountPrice) < d.price, {
    message: 'El precio con descuento debe ser menor al precio normal',
    path: ['discountPrice'],
  })
  .refine((d) => !d.discountPrice || !!d.discountEndDate, {
    message: 'Indica hasta cuándo aplica el descuento',
    path: ['discountEndDate'],
  });

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormValues) => void;
  isLoading?: boolean;
  /** id linking an external submit button (in the page header) to this form. */
  formId?: string;
}

const currency = (n?: number) =>
  n || n === 0
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
    : '—';

export function ProductForm({ initialData, onSubmit, isLoading, formId = 'product-form' }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      images: [],
      height: 0,
      width: 0,
      length: 0,
      longDescription: '',
      universeId: '',
      categoryId: '',
      isB2BOnly: false,
      isActive: true,
      variants: [],
      discountPrice: '',
      discountEndDate: '',
    },
  });

  const { data: categories } = useCategories();
  const { data: universes } = useUniverses();

  const watchedUniverseId = form.watch('universeId');

  useEffect(() => {
    if (initialData) return;
    if (form.getValues('universeId')) return;
    const hogar = universes?.find((u) => u.slug === 'hogar');
    if (hogar) form.setValue('universeId', hogar.id);
  }, [universes, initialData, form]);

  useEffect(() => {
    if (!watchedUniverseId || !categories) return;
    const currentCategoryId = form.getValues('categoryId');
    if (!currentCategoryId) return;
    const cat = categories.find((c) => c.id === currentCategoryId);
    if (cat && cat.universeId !== watchedUniverseId) form.setValue('categoryId', '');
  }, [watchedUniverseId, categories, form]);

  const filteredCategories = (categories || []).filter(
    (c) => !watchedUniverseId || c.universeId === watchedUniverseId,
  );

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'variants' });

  // Compact variant rows: track which are expanded; auto-expand on add.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pendingExpand = useRef(false);
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    if (pendingExpand.current && fields.length) {
      const last = fields[fields.length - 1];
      setExpanded((prev) => new Set(prev).add(last.id));
      pendingExpand.current = false;
    }
  }, [fields]);

  const addVariant = () => {
    pendingExpand.current = true;
    append({ name: '', sku: '', stock: 0, price: 0, images: [] });
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        price: initialData.price,
        stock: initialData.stock,
        images: initialData.images,
        height: initialData.height || 0,
        width: initialData.width || 0,
        length: initialData.length || 0,
        longDescription: initialData.longDescription || '',
        universeId:
          initialData.universeId || initialData.universe?.id || initialData.category?.universeId || '',
        categoryId: initialData.categoryId || initialData.category?.id || '',
        isB2BOnly: initialData.isB2BOnly || false,
        isActive: initialData.isActive ?? true,
        discountPrice: initialData.discountPrice ? String(initialData.discountPrice) : '',
        // El input date espera yyyy-MM-dd; la API devuelve ISO completo.
        discountEndDate: initialData.discountEndDate
          ? initialData.discountEndDate.slice(0, 10)
          : '',
        variants:
          initialData.variants?.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price || initialData.price,
            stock: v.stock,
            images: v.images || [],
          })) || [],
      });
    }
  }, [initialData, form]);

  const watchedVariants = form.watch('variants') || [];

  const watchedPrice = form.watch('price');
  const watchedDiscountPrice = form.watch('discountPrice');
  const hasDiscount =
    !!watchedDiscountPrice &&
    Number(watchedDiscountPrice) > 0 &&
    Number(watchedDiscountPrice) < Number(watchedPrice);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(watchedDiscountPrice) / Number(watchedPrice)) * 100)
    : 0;

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del producto" {...field} />
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
                      <FormLabel>Descripción corta</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción breve para listados" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción larga</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="longDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ReactQuill theme="snow" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imágenes del producto</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Variantes</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar variante
                </Button>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                    <Package className="h-8 w-8 opacity-40" />
                    Este producto no tiene variantes. Se venderá con el precio y stock global.
                  </div>
                ) : (
                  <div className="divide-y rounded-md border">
                    {fields.map((field, index) => {
                      const isOpen = expanded.has(field.id);
                      const v = watchedVariants[index];
                      return (
                        <div key={field.id}>
                          <div
                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                            onClick={() => toggle(field.id)}
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            )}
                            <span className="flex-1 truncate text-sm font-medium">
                              {v?.name || <span className="text-muted-foreground">Nueva variante</span>}
                            </span>
                            <span className="hidden text-xs text-muted-foreground sm:inline">
                              {v?.sku || 'sin SKU'}
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {Number(v?.stock) || 0} uds
                            </span>
                            <span className="w-20 text-right text-xs font-medium tabular-nums">
                              {currency(Number(v?.price) || undefined)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(index);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          {isOpen && (
                            <div className="space-y-4 border-t bg-muted/20 p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nombre (ej. Rojo, XL)</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.sku`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>SKU</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Precio (opcional)</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.stock`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Stock</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name={`variants.${index}.images`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Imágenes de la variante</FormLabel>
                                    <FormControl>
                                      <ImageUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isLoading}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Producto activo</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Si lo desactivas no aparecerá en la tienda.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isB2BOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Solo para B2B</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Se oculta de la tienda principal y solo aparece en el catálogo B2B.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="universeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Universo</FormLabel>
                      <Select key={field.value || 'empty-universe'} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar universo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {universes?.map((universe) => (
                            <SelectItem key={universe.id} value={universe.id}>
                              {universe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select key={field.value || 'empty-category'} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={watchedUniverseId ? 'Seleccionar categoría' : 'Elegí primero un universo'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCategories.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Sin categorías en este universo
                            </div>
                          ) : (
                            filteredCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Precio e inventario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (COP)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock global</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Si el producto tiene variantes, el stock de cada variante manda sobre el global.
                </p>

                <div className="space-y-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Precio promocional</p>
                    <p className="text-xs text-muted-foreground">
                      Opcional. La tienda muestra este precio hasta la fecha indicada.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio con descuento (COP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Sin promoción"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vigente hasta</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasDiscount && (
                    <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">
                      El cliente verá{' '}
                      <span className="font-semibold">{currency(Number(watchedDiscountPrice))}</span>{' '}
                      en vez de{' '}
                      <span className="line-through">{currency(Number(watchedPrice))}</span>
                      {discountPercent > 0 && <> · {discountPercent}% menos</>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dimensiones (cm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ancho</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largo</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
