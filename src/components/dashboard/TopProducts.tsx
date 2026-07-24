import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/dashboard';

interface VariantData {
  name: string;
  sold: number;
}

interface ProductData {
  name: string;
  sold: number;
  revenue: number;
  variants: VariantData[];
}

interface TopProductsProps {
  data: ProductData[];
}

export function TopProducts({ data }: TopProductsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const maxSold = data[0]?.sold || 1;

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Top Productos</CardTitle>
        <CardDescription>
          Los 10 productos más vendidos (click para ver variantes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ventas</p>
          )}
          {data.map((product, i) => {
            const hasVariants = product.variants.length > 0;
            const isOpen = expanded.has(product.name);

            return (
              <div key={product.name}>
                <div
                  className={`flex items-center gap-3 py-2 ${hasVariants ? 'cursor-pointer hover:bg-muted/50 rounded-md px-1 -mx-1' : ''}`}
                  onClick={() => hasVariants && toggle(product.name)}
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                  {hasVariants ? (
                    isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <span className="w-3.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{product.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0 tabular-nums">
                        {product.sold} uds · {formatCurrency(product.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${(product.sold / maxSold) * 100}%`, backgroundColor: '#2a78d6' }}
                      />
                    </div>
                  </div>
                </div>

                {hasVariants && isOpen && (
                  <div className="ml-12 mt-1 mb-2 space-y-1.5 border-l-2 border-border pl-3">
                    {product.variants.map(v => (
                      <div key={v.name} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate">{v.name}</span>
                        <span className="text-muted-foreground flex-shrink-0 ml-2 tabular-nums">{v.sold} uds</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
