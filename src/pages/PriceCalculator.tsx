import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePricingSettings,
  useUpdatePricingSettings,
  usePriceCalculation,
} from '@/hooks/usePricing';
import { Calculator, Settings2, AlertTriangle } from 'lucide-react';
import type { PricingSettings } from '@/types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Math.round(n));

const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Campos de los parámetros, con la unidad y la ayuda que necesita cada uno. */
const SETTING_FIELDS: {
  key: keyof PricingSettings;
  label: string;
  help: string;
  /** Se edita como porcentaje aunque se guarde como fracción. */
  percent?: boolean;
  step?: number;
}[] = [
  {
    key: 'filamentPricePerKg',
    label: 'Precio del rollo (por kg)',
    help: 'Lo que pagas por un kilo de filamento.',
    step: 1000,
  },
  {
    key: 'wastePercent',
    label: 'Merma',
    help: 'Material que se pierde en fallos y purga de color.',
    percent: true,
  },
  {
    key: 'printerWatts',
    label: 'Consumo de la impresora (W)',
    help: 'Consumo medio mientras imprime.',
    step: 10,
  },
  {
    key: 'energyPricePerKwh',
    label: 'Precio del kWh',
    help: 'De tu factura de energía.',
    step: 50,
  },
  {
    key: 'printerCost',
    label: 'Costo de la impresora',
    help: 'Lo que costó. De aquí sale la depreciación.',
    step: 100000,
  },
  {
    key: 'printerLifeHours',
    label: 'Vida útil (horas)',
    help: 'Horas de impresión que esperas que dure antes de reemplazarla.',
    step: 500,
  },
  {
    key: 'laborPricePerHour',
    label: 'Tu hora de trabajo',
    help: 'Cuánto vale una hora de quitar soportes, lijar, armar y empacar.',
    step: 1000,
  },
  {
    key: 'packagingCost',
    label: 'Empaque por pieza',
    help: 'Caja, relleno y consumibles que no dependen del tamaño.',
    step: 500,
  },
  {
    key: 'targetMargin',
    label: 'Margen objetivo',
    help: 'Sobre el precio de venta, no sobre el costo.',
    percent: true,
  },
  {
    key: 'paymentFeePercent',
    label: 'Comisión de la pasarela',
    help: 'Lo que cobra Wompi. Solo afecta el margen que se muestra.',
    percent: true,
  },
  {
    key: 'roundingStep',
    label: 'Redondear a múltiplos de',
    help: 'El precio siempre se redondea hacia arriba.',
    step: 100,
  },
];

export default function PriceCalculator() {
  const { data: settings } = usePricingSettings();
  const updateSettings = useUpdatePricingSettings();

  const [grams, setGrams] = useState(250);
  const [hours, setHours] = useState(10);
  const [laborMinutes, setLaborMinutes] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  // Se espera a que dejen de escribir antes de pedir el cálculo: sin esto sale
  // una petición por cada tecla.
  const [debounced, setDebounced] = useState({ grams, hours, laborMinutes });
  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced({ grams, hours, laborMinutes }),
      300,
    );
    return () => clearTimeout(timer);
  }, [grams, hours, laborMinutes]);

  const { data } = usePriceCalculation(debounced);
  const breakdown = data?.breakdown;

  // Lo que daba el método anterior, para comparar durante la transición.
  const oldMethod = settings
    ? grams * (settings.filamentPricePerKg / 1000) * 3
    : 0;
  const oldMethodLoses = !!breakdown && oldMethod < breakdown.cost;

  const [draft, setDraft] = useState<Partial<PricingSettings>>({});
  const valueOf = (key: keyof PricingSettings) =>
    (draft[key] as number | undefined) ??
    (settings?.[key] as number | undefined) ??
    0;

  const saveSettings = async () => {
    if (Object.keys(draft).length === 0) {
      setShowSettings(false);
      return;
    }
    await updateSettings.mutateAsync(draft);
    setDraft({});
    setShowSettings(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calculadora de precios</h1>
          <p className="text-sm text-muted-foreground">
            Copia los gramos y las horas del slice de Bambu Studio.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowSettings((v) => !v)}
        >
          <Settings2 className="h-4 w-4" />
          {showSettings ? 'Ocultar costos' : 'Ajustar costos'}
        </Button>
      </div>

      {showSettings && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Costos del negocio</CardTitle>
            <p className="text-sm text-muted-foreground">
              Se guardan una sola vez y aplican a todos los cálculos. Si sube el
              filamento, se cambia aquí y ya.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SETTING_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.percent && ' (%)'}
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  step={field.percent ? 0.5 : (field.step ?? 1)}
                  value={
                    field.percent
                      ? Number((valueOf(field.key) * 100).toFixed(2))
                      : valueOf(field.key)
                  }
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    setDraft((prev) => ({
                      ...prev,
                      [field.key]: field.percent ? raw / 100 : raw,
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">{field.help}</p>
              </div>
            ))}
          </CardContent>
          <CardContent className="flex justify-end gap-2 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setDraft({});
                setShowSettings(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={saveSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Guardando...' : 'Guardar costos'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" /> La pieza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="grams">Filamento (gramos)</Label>
              <Input
                id="grams"
                type="number"
                min={0}
                value={grams}
                onChange={(e) => setGrams(Math.max(0, Number(e.target.value)))}
              />
              <p className="text-xs text-muted-foreground">
                Usa el total del slice: ya incluye la purga entre colores.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="hours">Tiempo de impresión (horas)</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
              />
              <p className="text-xs text-muted-foreground">
                Es el dato que el método anterior ignoraba.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="labor">Trabajo manual (minutos)</Label>
              <Input
                id="labor"
                type="number"
                min={0}
                step={5}
                value={laborMinutes}
                onChange={(e) =>
                  setLaborMinutes(Math.max(0, Number(e.target.value)))
                }
              />
              <p className="text-xs text-muted-foreground">
                Quitar soportes, lijar, armar y empacar.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!breakdown ? (
              <p className="text-sm text-muted-foreground">Calculando...</p>
            ) : (
              <>
                <div className="space-y-1 text-sm">
                  {(
                    [
                      ['Material', breakdown.material],
                      ['Merma', breakdown.waste],
                      ['Luz', breakdown.energy],
                      ['Depreciación', breakdown.depreciation],
                      ['Trabajo', breakdown.labor],
                      ['Empaque', breakdown.packaging],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-1 font-medium">
                    <span>Costo</span>
                    <span>{formatCurrency(breakdown.cost)}</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Precio de venta</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(breakdown.roundedPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    exacto {formatCurrency(breakdown.suggestedPrice)}
                  </p>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margen</span>
                    <span className="font-medium">
                      {formatPercent(breakdown.margin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Después de Wompi</span>
                    <span>{formatPercent(breakdown.marginAfterFee)}</span>
                  </div>
                  {breakdown.marginWithFreeShipping !== null && (
                    <div className="flex justify-between text-amber-600">
                      <span>Si activa envío gratis</span>
                      <span>
                        {formatPercent(breakdown.marginWithFreeShipping)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Durante la transición conviene ver los dos números juntos: en
                    piezas gruesas y rápidas se parecen, y es justo donde el
                    método anterior funcionaba bien. */}
                <div className="rounded border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Método anterior (×3)
                    </span>
                    <span>{formatCurrency(oldMethod)}</span>
                  </div>
                  {oldMethodLoses && (
                    <p className="mt-2 flex gap-2 text-xs text-red-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Con el método anterior esta pieza se vendía por debajo de
                      lo que cuesta producirla.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
