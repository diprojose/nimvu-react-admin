import { useState } from 'react';
import { useReviews, useModerateReview, useDeleteReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Star, Trash, MessageSquare } from 'lucide-react';
import type { Review, ReviewStatus } from '@/types';

const STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Publicada',
  REJECTED: 'Rechazada',
};

const STATUS_VARIANT: Record<ReviewStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};

const TABS: Array<{ value: ReviewStatus | 'ALL'; label: string }> = [
  // Pendientes primero: es la única pestaña que exige acción.
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Publicadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'ALL', label: 'Todas' },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </span>
  );
}

export default function Reviews() {
  const [tab, setTab] = useState<ReviewStatus | 'ALL'>('PENDING');
  const [replyTo, setReplyTo] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: reviews = [], isLoading } = useReviews(
    tab === 'ALL' ? undefined : tab,
  );
  const moderate = useModerateReview();
  const remove = useDeleteReview();

  const openReply = (review: Review) => {
    setReplyTo(review);
    setReplyText(review.adminReply ?? '');
  };

  const saveReply = () => {
    if (!replyTo) return;
    moderate.mutate(
      { id: replyTo.id, adminReply: replyText.trim() },
      { onSuccess: () => setReplyTo(null) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <p className="text-sm text-muted-foreground">
          Solo reseñan clientes con una orden entregada de ese producto. Nada se
          publica en la tienda hasta que lo apruebes aquí.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Cargando...' : `${reviews.length} reseña${reviews.length === 1 ? '' : 's'}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tab === 'PENDING'
                ? 'No hay reseñas esperando revisión.'
                : 'No hay reseñas en este estado.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Calificación</TableHead>
                  <TableHead>Comentario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.product.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{review.authorName}</div>
                      <div className="text-xs text-muted-foreground">{review.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Stars value={review.rating} />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="whitespace-pre-line text-sm">{review.comment}</p>
                      {review.adminReply && (
                        <p className="mt-2 border-l-2 border-gray-300 pl-2 text-xs text-muted-foreground">
                          <strong>Nimvu:</strong> {review.adminReply}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[review.status]}>
                        {STATUS_LABEL[review.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {review.status !== 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Publicar en la tienda"
                            onClick={() =>
                              moderate.mutate({ id: review.id, status: 'APPROVED' })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {review.status !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Rechazar"
                            onClick={() =>
                              moderate.mutate({ id: review.id, status: 'REJECTED' })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          title="Responder públicamente"
                          onClick={() => openReply(review)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Borrar"
                          onClick={() => {
                            if (confirm('¿Borrar esta reseña? No se puede deshacer.')) {
                              remove.mutate(review.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!replyTo} onOpenChange={(open) => !open && setReplyTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder la reseña</DialogTitle>
          </DialogHeader>
          {replyTo && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <Stars value={replyTo.rating} />
                <p className="mt-1 whitespace-pre-line">{replyTo.comment}</p>
              </div>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tu respuesta aparece publicada bajo la reseña."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReplyTo(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveReply} disabled={moderate.isPending}>
                  Guardar respuesta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
