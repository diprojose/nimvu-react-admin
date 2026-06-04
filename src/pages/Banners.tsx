import { useState } from 'react';
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from '@/hooks/useBanners';
import { useUniverses } from '@/hooks/useUniverses';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Banner } from '@/types';
import { BannerForm } from '@/components/banners/BannerForm';

const HOME_FILTER = '__home__';
const ALL_FILTER = 'all';

export default function Banners() {
  const { data: universes } = useUniverses();
  const [universeFilter, setUniverseFilter] = useState<string>(ALL_FILTER);

  const filter =
    universeFilter === ALL_FILTER
      ? {}
      : universeFilter === HOME_FILTER
      ? { home: true }
      : { universeId: universeFilter };

  const { data: banners, isLoading, error } = useBanners(filter);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>(undefined);

  const handleSave = (values: any) => {
    if (editingBanner) {
      updateBanner.mutate(
        { id: editingBanner.id, ...values },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingBanner(undefined);
          },
        },
      );
    } else {
      createBanner.mutate(values, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingBanner(undefined);
        },
      });
    }
  };

  const openCreateModal = () => {
    setEditingBanner(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este banner?')) {
      deleteBanner.mutate(id);
    }
  };

  const defaultUniverseId =
    universeFilter !== ALL_FILTER && universeFilter !== HOME_FILTER
      ? universeFilter
      : undefined;

  if (isLoading) return <div>Cargando banners...</div>;
  if (error) return <div>Error al cargar banners</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Banners</h1>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Crear Banner
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por:</span>
        <Select value={universeFilter} onValueChange={setUniverseFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>Todos</SelectItem>
            <SelectItem value={HOME_FILTER}>Home (sin universo)</SelectItem>
            {universes?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Imagen</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Universo</TableHead>
              <TableHead>CTA</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners?.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-16 w-28 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-16 w-28 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{banner.title}</div>
                  {banner.badge && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                      {banner.badge}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {banner.universe ? (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: banner.universe.secondaryColor || undefined,
                        borderColor: banner.universe.primaryColor || undefined,
                        color: banner.universe.accentColor || undefined,
                      }}
                    >
                      {banner.universe.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Home</span>
                  )}
                </TableCell>
                <TableCell>
                  {banner.ctaText ? (
                    <span className="text-sm text-muted-foreground">
                      {banner.ctaText} → {banner.ctaHref}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{banner.order}</TableCell>
                <TableCell>
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditModal(banner)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {banners?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay banners. Hacé clic en "Crear Banner" para empezar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Editar Banner' : 'Crear Banner'}</DialogTitle>
          </DialogHeader>
          <BannerForm
            initialData={editingBanner}
            defaultUniverseId={defaultUniverseId}
            onSubmit={handleSave}
            isLoading={createBanner.isPending || updateBanner.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
