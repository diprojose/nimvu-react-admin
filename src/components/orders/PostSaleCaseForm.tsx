import { useEffect } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';

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
} from '@/components/ui/select';
import type { Order, OrderItem, PostSaleCase } from '@/types';
import {
  POST_SALE_FAULT_LABELS,
  POST_SALE_PAYER_HINTS,
  POST_SALE_PAYER_LABELS,
  POST_SALE_STATUS_LABELS,
  POST_SALE_TYPE_LABELS,
  SUGGESTED_FAULT,
  SUGGESTED_PAYER,
} from '@/lib/post-sale';

const itemSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  fromVariantName: z.string().optional(),
  variantName: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
  note: z.string().optional(),
});

const caseSchema = z.object({
  type: z.enum(['TRANSIT_DAMAGE', 'CUSTOMER_DAMAGE', 'EXCHANGE', 'MISSING_ITEM', 'OTHER']),
  fault: z.enum(['NIMVU', 'CUSTOMER', 'UNDEFINED']),
  status: z.enum(['OPEN', 'PREPARING', 'SHIPPED', 'RESOLVED', 'CANCELLED']),
  description: z.string().optional(),
  shippingPayer: z.enum(['NIMVU', 'CUSTOMER_TO_NIMVU', 'CUSTOMER_TO_COURIER', '']).optional(),
  shippingAmount: z.coerce.number().min(0).optional(),
  shippingCarrier: z.enum(['ENVIA', 'SERVIENTREGA', '']).optional(),
  trackingNumber: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

export type PostSaleCaseFormValues = z.infer<typeof caseSchema>;

interface PostSaleCaseFormProps {
  order: Order;
  initialData?: PostSaleCase;
  onSubmit: (values: PostSaleCaseFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EMPTY_VALUES: PostSaleCaseFormValues = {
  type: 'TRANSIT_DAMAGE',
  fault: 'NIMVU',
  status: 'OPEN',
  description: '',
  shippingPayer: 'NIMVU',
  shippingAmount: 0,
  shippingCarrier: '',
  trackingNumber: '',
  items: [],
};

export function PostSaleCaseForm({
  order,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: PostSaleCaseFormProps) {
  const form = useForm<PostSaleCaseFormValues>({
    resolver: zodResolver(caseSchema) as Resolver<PostSaleCaseFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (!initialData) {
      form.reset(EMPTY_VALUES);
      return;
    }
    form.reset({
      type: initialData.type,
      fault: initialData.fault,
      status: initialData.status,
      description: initialData.description ?? '',
      shippingPayer: initialData.shippingPayer ?? '',
      shippingAmount: initialData.shippingAmount ?? 0,
      shippingCarrier: initialData.shippingCarrier ?? '',
      trackingNumber: initialData.trackingNumber ?? '',
      items:
        initialData.items?.map((item) => ({
          productId: item.productId,
          fromVariantName: item.fromVariantName ?? '',
          variantName: item.variantName ?? '',
          quantity: item.quantity,
          note: item.note ?? '',
        })) ?? [],
    });
  }, [initialData, form]);

  const type = form.watch('type');
  const shippingPayer = form.watch('shippingPayer');
  const isExchange = type === 'EXCHANGE';

  // Al elegir el tipo, sugiere el responsable habitual (y este a su vez sugiere
  // quien paga). Solo aplica al crear: editando no se pisan los datos guardados.
  const handleTypeChange = (value: PostSaleCaseFormValues['type']) => {
    form.setValue('type', value);
    if (initialData) return;
    const suggestedFault = SUGGESTED_FAULT[value];
    form.setValue('fault', suggestedFault);
    form.setValue('shippingPayer', SUGGESTED_PAYER[suggestedFault]);
  };

  // Cambiar el responsable a mano tambien reajusta quien paga el envio.
  const handleFaultChange = (value: PostSaleCaseFormValues['fault']) => {
    form.setValue('fault', value);
    if (initialData) return;
    form.setValue('shippingPayer', SUGGESTED_PAYER[value]);
  };

  const orderItems = order.items ?? [];

  const addItem = () => {
    const first = orderItems[0];
    append({
      productId: first?.productId ?? '',
      fromVariantName: first?.variantName ?? '',
      variantName: '',
      quantity: 1,
      note: '',
    });
  };

  // Nombre de la variante que el cliente recibio, para prellenar el "de".
  const originalVariantOf = (productId: string) =>
    orderItems.find((i: OrderItem) => i.productId === productId)?.variantName ?? '';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de caso</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => handleTypeChange(v as PostSaleCaseFormValues['type'])}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(POST_SALE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fault"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => handleFaultChange(v as PostSaleCaseFormValues['fault'])}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(POST_SALE_FAULT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(POST_SALE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── PRODUCTOS AFECTADOS ── */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Productos afectados</p>
              <p className="text-xs text-muted-foreground">
                {isExchange
                  ? 'Indica qué variante tenía el cliente y cuál se le envió.'
                  : 'Qué se rompió o faltó, y cuántas unidades.'}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground border rounded-md px-3 py-4 text-center">
              Sin productos agregados.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-3 space-y-3">
                  <div className="flex gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Producto</FormLabel>
                          <Select
                            value={f.value}
                            onValueChange={(v) => {
                              f.onChange(v);
                              if (isExchange) {
                                form.setValue(
                                  `items.${index}.fromVariantName`,
                                  originalVariantOf(v),
                                );
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {orderItems.map((item: OrderItem) => (
                                <SelectItem key={item.id} value={item.productId}>
                                  {item.product?.name ?? 'Producto'}
                                  {item.variantName ? ` — ${item.variantName}` : ''}
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
                      name={`items.${index}.quantity`}
                      render={({ field: f }) => (
                        <FormItem className="w-24">
                          <FormLabel className="text-xs">Cantidad</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {isExchange && (
                      <FormField
                        control={form.control}
                        name={`items.${index}.fromVariantName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Variante que tenía</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Azul" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name={`items.${index}.variantName`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            {isExchange ? 'Variante que se le envió' : 'Variante enviada'}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Beige" {...f} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ENVÍO DEL REPUESTO ── */}
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium">Envío del repuesto</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shippingPayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Quién paga el envío?</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin definir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(POST_SALE_PAYER_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {shippingPayer && (
                    <FormDescription>
                      {POST_SALE_PAYER_HINTS[shippingPayer as keyof typeof POST_SALE_PAYER_HINTS]}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor del envío (COP)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={100} {...field} />
                  </FormControl>
                  <FormDescription>
                    {shippingPayer === 'CUSTOMER_TO_COURIER'
                      ? 'Se guarda como referencia; no cuenta como ingreso.'
                      : 'Déjalo en 0 si no aplica.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shippingCarrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transportadora</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin definir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ENVIA">Envía</SelectItem>
                      <SelectItem value="SERVIENTREGA">Servientrega</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de guía</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="border-t pt-4">
              <FormLabel>Notas internas</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  placeholder="Qué pasó, qué se acordó con el cliente..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormDescription>
                Solo las ve el equipo. El cliente nunca las ve.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Registrar caso'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
