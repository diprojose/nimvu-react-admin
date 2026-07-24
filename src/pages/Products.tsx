import { useProducts, useDeleteProduct, useUpdateProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function Products() {
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const navigate = useNavigate();

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando productos...</div>;
  if (error) return <div className="py-10 text-center text-destructive">Error al cargar productos</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">{products?.length ?? 0} productos en el catálogo</p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="mr-2 h-4 w-4" /> Crear Producto
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product: Product) => (
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
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(product.price)}</TableCell>
                <TableCell className="tabular-nums">{product.stock}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
