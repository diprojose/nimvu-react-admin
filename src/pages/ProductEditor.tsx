import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm, type ProductFormValues } from '@/components/products/ProductForm';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { ProductInput, VariantInput } from '@/types';

const FORM_ID = 'product-form';

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const editingProduct = isEdit ? products?.find((p) => p.id === id) : undefined;
  const saving = createProduct.isPending || updateProduct.isPending;

  // Duplicar: /products/new?from=<id> precarga el formulario con una copia.
  // No se crea nada hasta que el usuario guarde, así que cancelar no deja
  // productos basura.
  const duplicateFromId = searchParams.get('from');
  const duplicateSource = useMemo(() => {
    if (isEdit || !duplicateFromId) return undefined;
    const source = products?.find((p) => p.id === duplicateFromId);
    if (!source) return undefined;
    return {
      ...source,
      name: `${source.name} (copia)`,
      // El SKU es único en la base: sin sufijo, guardar fallaría.
      variants: source.variants?.map((v) => ({ ...v, sku: `${v.sku}-COPIA` })),
    };
  }, [isEdit, duplicateFromId, products]);

  const initialData = editingProduct ?? duplicateSource;

  const handleSave = (values: ProductFormValues) => {
    const variants: VariantInput[] =
      values.variants?.map((v) => ({
        name: v.name,
        sku: v.sku,
        stock: Number(v.stock),
        price: v.price ? Number(v.price) : Number(values.price),
        images: v.images || [],
      })) || [];

    // Campos de promoción vacíos viajan como null para poder quitarla.
    const hasDiscount = !!values.discountPrice && Number(values.discountPrice) > 0;

    const payload: ProductInput = {
      ...values,
      price: Number(values.price),
      stock: Number(values.stock),
      images: values.images || [],
      variants,
      discountPrice: hasDiscount ? Number(values.discountPrice) : null,
      discountEndDate:
        hasDiscount && values.discountEndDate
          ? new Date(`${values.discountEndDate}T23:59:59`).toISOString()
          : null,
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

  if ((isEdit || duplicateFromId) && isLoading) {
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

      {duplicateSource && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Estás duplicando <strong>{products?.find((p) => p.id === duplicateFromId)?.name}</strong>.
          Ajusta el nombre y los SKU de las variantes antes de guardar. No se crea nada hasta que
          presiones "Crear producto".
        </div>
      )}

      <ProductForm
        formId={FORM_ID}
        initialData={initialData}
        onSubmit={handleSave}
        isLoading={saving}
      />
    </div>
  );
}
