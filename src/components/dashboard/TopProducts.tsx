import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight } from 'lucide-react';

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export function TopProducts({ data }: TopProductsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const maxSold = data[0]?.sold || 1;

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Top Productos</CardTitle>
        <CardDescription>
          Los 10 productos más vendidos (click para ver variantes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos de ventas</p>
          )}
          {data.map((product, i) => {
            const hasVariants = product.variants.length > 0;
            const isOpen = expanded.has(product.name);

            return (
              <div key={product.name}>
                <div
                  className={`flex items-center gap-3 py-2 ${hasVariants ? 'cursor-pointer hover:bg-gray-50 rounded-md px-1 -mx-1' : ''}`}
                  onClick={() => hasVariants && toggle(product.name)}
                >
                  <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                  {hasVariants ? (
                    isOpen ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <span className="w-3.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{product.name}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {product.sold} uds · {formatCurrency(product.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(product.sold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {hasVariants && isOpen && (
                  <div className="ml-12 mt-1 mb-2 space-y-1.5 border-l-2 border-gray-100 pl-3">
                    {product.variants.map(v => (
                      <div key={v.name} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 truncate">{v.name}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">{v.sold} uds</span>
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
