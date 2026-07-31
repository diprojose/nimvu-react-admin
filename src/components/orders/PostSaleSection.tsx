import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Pencil, Plus, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order, PostSaleCase } from '@/types';
import {
  POST_SALE_FAULT_LABELS,
  POST_SALE_PAYER_HINTS,
  POST_SALE_PAYER_LABELS,
  POST_SALE_STATUS_COLORS,
  POST_SALE_STATUS_LABELS,
  POST_SALE_TYPE_COLORS,
  POST_SALE_TYPE_LABELS,
  formatCOP,
} from '@/lib/post-sale';
import {
  useCreatePostSaleCase,
  useDeletePostSaleCase,
  useUpdatePostSaleCase,
  type PostSaleCaseInput,
} from '@/hooks/usePostSaleCases';
import { PostSaleCaseForm, type PostSaleCaseFormValues } from './PostSaleCaseForm';

interface PostSaleSectionProps {
  order: Order;
}

export function PostSaleSection({ order }: PostSaleSectionProps) {
  const [editing, setEditing] = useState<PostSaleCase | 'new' | null>(null);

  const createCase = useCreatePostSaleCase();
  const updateCase = useUpdatePostSaleCase();
  const deleteCase = useDeletePostSaleCase();

  const cases = order.postSaleCases ?? [];
  const isSaving = createCase.isPending || updateCase.isPending;

  // Los selects vacios viajan como '' y el backend espera el campo ausente.
  const toPayload = (values: PostSaleCaseFormValues) => ({
    type: values.type,
    fault: values.fault,
    status: values.status,
    description: values.description?.trim() || undefined,
    shippingPayer: values.shippingPayer || undefined,
    shippingAmount: values.shippingAmount || undefined,
    shippingCarrier: values.shippingCarrier || undefined,
    trackingNumber: values.trackingNumber?.trim() || undefined,
    items: values.items.map((item) => ({
      productId: item.productId,
      variantName: item.variantName?.trim() || undefined,
      fromVariantName: item.fromVariantName?.trim() || undefined,
      quantity: item.quantity,
      note: item.note?.trim() || undefined,
    })),
  });

  const handleSubmit = (values: PostSaleCaseFormValues) => {
    const payload = toPayload(values);
    const onError = () => alert('No se pudo guardar el caso. Intenta de nuevo.');

    if (editing && editing !== 'new') {
      updateCase.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => setEditing(null), onError },
      );
      return;
    }

    createCase.mutate(
      { orderId: order.id, ...payload } as PostSaleCaseInput,
      { onSuccess: () => setEditing(null), onError },
    );
  };

  const handleDelete = (postSaleCase: PostSaleCase) => {
    if (!window.confirm('¿Eliminar este caso de postventa?')) return;
    deleteCase.mutate(postSaleCase.id, {
      onError: () => alert('No se pudo eliminar el caso.'),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Postventa {cases.length > 0 && `(${cases.length})`}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
          <Plus className="mr-2 h-4 w-4" /> Registrar caso
        </Button>
      </div>

      {cases.length === 0 ? (
        <p className="text-sm text-gray-500 py-3">
          Sin casos registrados. Usa esto para roturas, cambios de color o faltantes.
        </p>
      ) : (
        <div className="space-y-3">
          {cases.map((postSaleCase) => (
            <div key={postSaleCase.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${POST_SALE_TYPE_COLORS[postSaleCase.type]}`}
                  >
                    {POST_SALE_TYPE_LABELS[postSaleCase.type]}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${POST_SALE_STATUS_COLORS[postSaleCase.status]}`}
                  >
                    {POST_SALE_STATUS_LABELS[postSaleCase.status]}
                  </span>
                  <span className="text-xs text-gray-500">
                    Responsable: {POST_SALE_FAULT_LABELS[postSaleCase.fault]}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditing(postSaleCase)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(postSaleCase)}
                    disabled={deleteCase.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {postSaleCase.items && postSaleCase.items.length > 0 && (
                <ul className="text-sm space-y-1">
                  {postSaleCase.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {item.product?.name ?? 'Producto'}
                      </span>
                      <span className="text-gray-500">x{item.quantity}</span>
                      {item.fromVariantName && item.variantName ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          {item.fromVariantName}
                          <ArrowRight className="h-3 w-3" />
                          {item.variantName}
                        </span>
                      ) : (
                        item.variantName && (
                          <span className="text-xs text-gray-600">{item.variantName}</span>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {postSaleCase.shippingPayer && (
                <p className="text-xs text-gray-600">
                  Envío: {POST_SALE_PAYER_LABELS[postSaleCase.shippingPayer]}
                  {postSaleCase.shippingAmount
                    ? ` — ${formatCOP(postSaleCase.shippingAmount)}`
                    : ''}
                  <span className="text-gray-400">
                    {' '}· {POST_SALE_PAYER_HINTS[postSaleCase.shippingPayer]}
                  </span>
                </p>
              )}

              {postSaleCase.trackingNumber && (
                <p className="text-xs text-gray-600">
                  Guía: <span className="font-mono">{postSaleCase.trackingNumber}</span>
                </p>
              )}

              {postSaleCase.description && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1.5">
                  {postSaleCase.description}
                </p>
              )}

              <p className="text-xs text-gray-400">
                Creado {format(parseISO(postSaleCase.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                {postSaleCase.resolvedAt &&
                  ` · Resuelto ${format(parseISO(postSaleCase.resolvedAt), "dd MMM yyyy", { locale: es })}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing && editing !== 'new' ? 'Editar caso de postventa' : 'Nuevo caso de postventa'}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <PostSaleCaseForm
              order={order}
              initialData={editing === 'new' ? undefined : editing}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
