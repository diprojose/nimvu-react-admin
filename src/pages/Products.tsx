import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Copy,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react';

import { useProducts, useDeleteProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useUniverses } from '@/hooks/useUniverses';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

type SortKey = 'name' | 'price' | 'stock' | 'createdAt';
type SortDir = 'asc' | 'desc';

const ALL = '__all__';

/** Stock efectivo: si hay variantes, manda la suma de sus stocks. */
const stockOf = (p: Product) =>
  p.variants && p.variants.length > 0
    ? p.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : p.stock;

/** Una promoción solo cuenta si tiene precio y no se ha vencido. */
const hasActiveDiscount = (p: Product) =>
  !!p.discountPrice &&
  p.discountPrice > 0 &&
  (!p.discountEndDate || new Date(p.discountEndDate) >= new Date());

export default function Products() {
  const { data: products, isLoading, error } = useProducts();
  const { data: universes } = useUniverses();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [universeId, setUniverseId] = useState<string>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Al cambiar de universo, la categoría elegida puede dejar de pertenecerle.
  const visibleCategories = useMemo(
    () =>
      (categories ?? []).filter((c) => universeId === ALL || c.universeId === universeId),
    [categories, universeId],
  );

  const handleUniverseChange = (value: string) => {
    setUniverseId(value);
    if (categoryId !== ALL) {
      const stillValid = (categories ?? []).some(
        (c) => c.id === categoryId && (value === ALL || c.universeId === value),
      );
      if (!stillValid) setCategoryId(ALL);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = (products ?? []).filter((p: Product) => {
      if (q) {
        const haystack = [
          p.name,
          p.description ?? '',
          ...(p.variants ?? []).map((v) => `${v.name} ${v.sku}`),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (universeId !== ALL && (p.universeId ?? p.universe?.id) !== universeId) return false;
      if (categoryId !== ALL && (p.categoryId ?? p.category?.id) !== categoryId) return false;

      if (status === 'active' && !(p.isActive ?? true)) return false;
      if (status === 'inactive' && (p.isActive ?? true)) return false;
      if (status === 'discounted' && !hasActiveDiscount(p)) return false;
      if (status === 'out_of_stock' && stockOf(p) > 0) return false;

      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return result.sort((a, b) => {
      switch (sortKey) {
        case 'price':
          return (a.price - b.price) * dir;
        case 'stock':
          return (stockOf(a) - stockOf(b)) * dir;
        case 'createdAt':
          return (a.createdAt ?? '').localeCompare(b.createdAt ?? '') * dir;
        default:
          return a.name.localeCompare(b.name, 'es') * dir;
      }
    });
  }, [products, query, universeId, categoryId, status, sortKey, sortDir]);

  const isFiltered = query !== '' || universeId !== ALL || categoryId !== ALL || status !== ALL;

  const clearFilters = () => {
    setQuery('');
    setUniverseId(ALL);
    setCategoryId(ALL);
    setStatus(ALL);
  };

  const SortHeader = ({ label, sortKey: key, className }: { label: string; sortKey: SortKey; className?: string }) => {
    const active = sortKey === key;
    const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
            active ? 'text-foreground font-semibold' : ''
          }`}
        >
          {label}
          <Icon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-40'}`} />
        </button>
      </TableHead>
    );
  };

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando productos...</div>;
  if (error) return <div className="py-10 text-center text-destructive">Error al cargar productos</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            {isFiltered
              ? `${filtered.length} de ${products?.length ?? 0} productos`
              : `${products?.length ?? 0} productos en el catálogo`}
          </p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="mr-2 h-4 w-4" /> Crear Producto
        </Button>
      </div>

      {/* ── BUSCADOR Y FILTROS ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, descripción o SKU..."
            className="pl-8"
          />
        </div>

        <Select value={universeId} onValueChange={handleUniverseChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Universo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los universos</SelectItem>
            {(universes ?? []).map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {visibleCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="discounted">En promoción</SelectItem>
            <SelectItem value="out_of_stock">Sin stock</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Imagen</TableHead>
              <SortHeader label="Nombre" sortKey="name" />
              <SortHeader label="Precio" sortKey="price" />
              <SortHeader label="Stock" sortKey="stock" />
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {isFiltered
                    ? 'Ningún producto coincide con los filtros.'
                    : 'Todavía no hay productos en el catálogo.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product: Product) => {
                const stock = stockOf(product);
                const discounted = hasActiveDiscount(product);
                return (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}/edit`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.universe?.name ?? '—'}
                          {product.category?.name ? ` · ${product.category.name}` : ''}
                          {product.variants && product.variants.length > 0
                            ? ` · ${product.variants.length} variantes`
                            : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {discounted ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-green-700">
                            {formatCurrency(product.discountPrice!)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      ) : (
                        formatCurrency(product.price)
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span className={stock === 0 ? 'font-medium text-destructive' : ''}>
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        role="switch"
                        aria-checked={product.isActive ?? true}
                        onClick={() =>
                          updateProduct.mutate({
                            id: product.id,
                            isActive: !(product.isActive ?? true),
                          })
                        }
                        disabled={updateProduct.isPending}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          (product.isActive ?? true) ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={(product.isActive ?? true) ? 'Activo' : 'Inactivo'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            (product.isActive ?? true) ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/products/${product.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/products/new?from=${product.id}`)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm('¿Estás seguro de eliminar este producto?')) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
