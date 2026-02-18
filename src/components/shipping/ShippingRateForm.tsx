import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import type { ShippingRate } from '@/types';
import { useEffect, useState } from 'react';
import colombiaData from '@/assets/colombia.min.json';

const shippingRateSchema = z.object({
  country: z.string().default('Colombia'),
  state: z.string().optional(),
  city: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser positivo'),
});

export type ShippingRateFormValues = z.infer<typeof shippingRateSchema>;

interface ShippingRateFormProps {
  initialData?: ShippingRate;
  onSubmit: (data: ShippingRateFormValues) => void;
  isLoading?: boolean;
}

export function ShippingRateForm({ initialData, onSubmit, isLoading }: ShippingRateFormProps) {
  const form = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateSchema) as any,
    defaultValues: {
      country: 'Colombia',
      state: '',
      city: '',
      price: 0,
    },
  });

  const [cities, setCities] = useState<string[]>([]);

  const selectedState = form.watch('state');

  useEffect(() => {
    if (initialData) {
      form.reset({
        country: initialData.country,
        state: initialData.state || '',
        city: initialData.city || '',
        price: initialData.price,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    if (selectedState) {
      const department = colombiaData.find(d => d.departamento === selectedState);
      setCities(department ? department.ciudades : []);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const handleSubmit = (values: ShippingRateFormValues) => {
    // If state/city are empty strings, send them as undefined/null is handled by backend or hook if needed, 
    // but here we just pass values. Backend service I saw handles empty strings -> null conversion.
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento (Opcional)</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue('city', ''); // Reset city on state change
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los departamentos" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="empty_value">Todos</SelectItem>
                    {colombiaData.map((dept) => (
                      <SelectItem key={dept.id} value={dept.departamento}>
                        {dept.departamento}
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
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad (Opcional)</FormLabel>
                <Select
                  disabled={!selectedState || selectedState === 'empty_value'}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="empty_value">Todas</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio de Envío</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
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
