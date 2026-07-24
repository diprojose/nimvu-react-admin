import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm, type ProductFormValues } from '@/components/products/ProductForm';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { ProductInput, VariantInput } from '@/types';

const FORM_ID = 'product-form';

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const editingProduct = isEdit ? products?.find((p) => p.id === id) : undefined;
  const saving = createProduct.isPending || updateProduct.isPending;

  const handleSave = (values: ProductFormValues) => {
    const variants: VariantInput[] =
      values.variants?.map((v) => ({
        name: v.name,
        sku: v.sku,
        stock: Number(v.stock),
        price: v.price ? Number(v.price) : Number(values.price),
        images: v.images || [],
      })) || [];

    const payload: ProductInput = {
      ...values,
      price: Number(values.price),
      stock: Number(values.stock),
      images: values.images || [],
      variants,
    };

    if (isEdit && editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, ...payload },
        { onSuccess: () => navigate('/products') },
      );
    } else {
      createProduct.mutate(payload, { onSuccess: () => navigate('/products') });
    }
  };

  if (isEdit && isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Cargando producto...</div>;
  }

  if (isEdit && !editingProduct) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">No encontramos este producto.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a productos
        </Button>
      </div>
    );
  }

  const title = isEdit ? 'Editar producto' : 'Nuevo producto';

  return (
    <div className="pb-10">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground">
                Productos
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate text-foreground">{title}</span>
            </div>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {editingProduct?.name || title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/products')} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </div>
      </div>

      <ProductForm
        formId={FORM_ID}
        initialData={editingProduct}
        onSubmit={handleSave}
        isLoading={saving}
      />
    </div>
  );
}
