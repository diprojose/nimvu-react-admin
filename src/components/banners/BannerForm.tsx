import { useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Banner } from '@/types';
import { useUniverses } from '@/hooks/useUniverses';

const HOME_VALUE = '__home__';

const bannerSchema = z.object({
  universeId: z.string().optional(),
  image: z.string().min(1, 'La imagen es requerida'),
  mobileImage: z.string().optional(),
  badge: z.string().optional(),
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  textColor: z.string().optional(),
  badgeColor: z.string().optional(),
  titleColor: z.string().optional(),
  subtitleColor: z.string().optional(),
  accentLineColor: z.string().optional(),
  ctaBgColor: z.string().optional(),
  ctaTextColor: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  initialData?: Banner;
  defaultUniverseId?: string;
  onSubmit: (data: BannerFormValues) => void;
  isLoading?: boolean;
}

export function BannerForm({
  initialData,
  defaultUniverseId,
  onSubmit,
  isLoading,
}: BannerFormProps) {
  const { data: universes } = useUniverses();

  // Seed defaults from initialData when editing so the form is correct on first
  // mount (avoids the Select flashing to "Home" before a useEffect resets it).
  const initialValues: BannerFormValues = initialData
    ? {
        universeId: initialData.universeId ?? undefined,
        image: initialData.image,
        mobileImage: initialData.mobileImage ?? '',
        badge: initialData.badge ?? '',
        title: initialData.title,
        subtitle: initialData.subtitle ?? '',
        ctaText: initialData.ctaText ?? '',
        ctaHref: initialData.ctaHref ?? '',
        textColor: initialData.textColor ?? '#FFFFFF',
        badgeColor: initialData.badgeColor ?? '#B55934',
        titleColor: initialData.titleColor ?? '#111827',
        subtitleColor: initialData.subtitleColor ?? '#374151',
        accentLineColor: initialData.accentLineColor ?? '#B55934',
        ctaBgColor: initialData.ctaBgColor ?? '#B55934',
        ctaTextColor: initialData.ctaTextColor ?? '#FFFFFF',
        order: initialData.order,
        isActive: initialData.isActive,
      }
    : {
        universeId: defaultUniverseId,
        image: '',
        mobileImage: '',
        badge: '',
        title: '',
        subtitle: '',
        ctaText: '',
        ctaHref: '',
        textColor: '#FFFFFF',
        badgeColor: '#B55934',
        titleColor: '#111827',
        subtitleColor: '#374151',
        accentLineColor: '#B55934',
        ctaBgColor: '#B55934',
        ctaTextColor: '#FFFFFF',
        order: 0,
        isActive: true,
      };

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: initialValues,
  });

  // If the parent swaps initialData while this form is mounted (rare with the
  // current dialog flow, but safe to keep), re-sync the form values.
  useEffect(() => {
    form.reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  const handleSubmit = (values: BannerFormValues) => {
    onSubmit({
      ...values,
      universeId: values.universeId === HOME_VALUE ? undefined : values.universeId,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 max-h-[80vh] overflow-y-auto px-1"
      >
        <FormField
          control={form.control}
          name="universeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Universo</FormLabel>
              <Select
                key={field.value || HOME_VALUE}
                value={field.value || HOME_VALUE}
                onValueChange={(v) => field.onChange(v === HOME_VALUE ? undefined : v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un universo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={HOME_VALUE}>Home (sin universo)</SelectItem>
                  {universes?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Dónde se muestra este banner.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen (desktop)</FormLabel>
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

        <FormField
          control={form.control}
          name="mobileImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen mobile (opcional)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ? [field.value] : []}
                  onChange={(urls) => field.onChange(urls[0] || '')}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>Si no la subís, se usa la de desktop.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="badge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Badge (texto pequeño superior)</FormLabel>
              <FormControl>
                <Input placeholder="BIENVENIDO A NIMVU" {...field} />
              </FormControl>
              <FormDescription>Aparece sobre el título, en mayúsculas espaciadas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Piezas únicas para espacios..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo / texto</FormLabel>
              <FormControl>
                <Input placeholder="Diseño moderno y funcional..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="ctaText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto del botón</FormLabel>
                <FormControl>
                  <Input placeholder="Explorar la tienda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctaHref"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link del botón</FormLabel>
                <FormControl>
                  <Input placeholder="/productos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="text-sm font-semibold text-muted-foreground">Colores</div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { name: 'badgeColor', label: 'Badge' },
              { name: 'titleColor', label: 'Título' },
              { name: 'subtitleColor', label: 'Subtítulo' },
              { name: 'accentLineColor', label: 'Línea de acento' },
              { name: 'ctaBgColor', label: 'Botón (fondo)' },
              { name: 'ctaTextColor', label: 'Botón (texto)' },
            ] as const).map((c) => (
              <FormField
                key={c.name}
                control={form.control}
                name={c.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{c.label}</FormLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={field.value || '#000000'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-12 rounded border cursor-pointer shrink-0"
                      />
                      <FormControl>
                        <Input className="h-9" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

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
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Activo</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
