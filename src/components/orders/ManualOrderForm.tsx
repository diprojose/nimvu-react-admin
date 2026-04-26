/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { dataLayer: any[] } }

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateManualOrder, type ManualOrderItem } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { Trash2, Plus, Search } from 'lucide-react';
import type { Product, Variant } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

interface LineItem extends ManualOrderItem {
  _key: number;
  productName: string;
  variantName?: string;
}

export default function ManualOrderForm({ isOpen, onClose }: Props) {
  const createManualOrder = useCreateManualOrder();
  const { data: products = [] } = useProducts();

  // Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Dirección
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Pago
  const [paymentMethod, setPaymentMethod] = useState<'WHATSAPP' | 'CASH_ON_DELIVERY' | 'WOMPI'>('WHATSAPP');
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  let keyCounter = 0;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProduct = (product: Product, variant?: Variant) => {
    const price = variant?.price ?? product.price;
    setLineItems((prev) => [
      ...prev,
      {
        _key: Date.now() + keyCounter++,
        productId: product.id,
        variantId: variant?.id,
        quantity: 1,
        price,
        productName: product.name,
        variantName: variant?.name,
      },
    ]);
    setProductSearch('');
    setShowProductSearch(false);
  };

  const updateItem = (key: number, field: 'quantity' | 'price', value: number) => {
    setLineItems((prev) =>
      prev.map((item) => (item._key === key ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (key: number) => {
    setLineItems((prev) => prev.filter((item) => item._key !== key));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  const handleReset = () => {
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
    setAddress(''); setCity(''); setState('');
    setLineItems([]); setProductSearch('');
    setPaymentMethod('WHATSAPP'); setShippingCost(0); setNotes('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('El nombre y teléfono del cliente son obligatorios.');
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim()) {
      setError('La dirección, ciudad y departamento son obligatorios.');
      return;
    }
    if (lineItems.length === 0) {
      setError('Agrega al menos un producto a la orden.');
      return;
    }

    try {
      const order = await createManualOrder.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        items: lineItems.map(({ productId, variantId, quantity, price }) => ({
          productId, variantId, quantity, price,
        })),
        paymentMethod,
        shippingCost,
        notes: notes.trim() || undefined,
      });

      // Hash user data for Meta (SHA-256)
      const encoder = new TextEncoder();
      const hashStr = async (str: string) => {
        const buf = await crypto.subtle.digest('SHA-256', encoder.encode(str.trim().toLowerCase()));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const phone = customerPhone.trim().replace(/\D/g, '');
      const email = customerEmail.trim().toLowerCase();
      const hashedPhone = phone ? await hashStr(phone) : undefined;
      const hashedEmail = email ? await hashStr(email) : undefined;

      // Fire purchase event to GTM → Meta Pixel
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'custom_purchase',
        action_source: 'system_generated',
        user_data: {
          ...(hashedEmail && { em: hashedEmail }),
          ...(hashedPhone && { ph: hashedPhone }),
        },
        ecommerce: {
          transaction_id: order.id,
          currency: 'COP',
          value: total,
          items: lineItems.map((item) => ({
            item_id: item.productId,
            item_name: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });

      handleClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al crear la orden.'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* ── CLIENTE ── */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
              Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre <span className="text-red-500">*</span></Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1">
                <Label>Teléfono <span className="text-red-500">*</span></Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="3001234567" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email <span className="text-gray-400 text-xs">(opcional)</span></Label>
              <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="cliente@email.com" type="email" />
            </div>
          </section>

          {/* ── DIRECCIÓN ── */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
              Dirección de Envío
            </h3>
            <div className="space-y-1">
              <Label>Dirección <span className="text-red-500">*</span></Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 123 # 45-67" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ciudad <span className="text-red-500">*</span></Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bogotá" />
              </div>
              <div className="space-y-1">
                <Label>Departamento <span className="text-red-500">*</span></Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Cundinamarca" />
              </div>
            </div>
          </section>

          {/* ── PRODUCTOS ── */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
              Productos
            </h3>

            {/* Buscador */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setShowProductSearch(true); }}
                    onFocus={() => setShowProductSearch(true)}
                  />
                </div>
              </div>

              {showProductSearch && productSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">Sin resultados</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div key={product.id}>
                        {/* Producto principal — siempre visible */}
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm"
                          onClick={() => addProduct(product)}
                        >
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0" />
                          )}
                          <span className="font-medium">{product.name}</span>
                          {product.variants && product.variants.length > 0 && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">base</span>
                          )}
                          <span className="ml-auto text-gray-500">{formatCurrency(product.price)}</span>
                        </button>
                        {/* Variantes indentadas debajo del producto */}
                        {product.variants?.map((variant) => (
                          <button
                            key={variant.id}
                            className="w-full text-left pl-10 pr-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm border-t border-gray-50"
                            onClick={() => addProduct(product, variant)}
                          >
                            {(variant.images?.[0] || product.images?.[0]) ? (
                              <img src={variant.images?.[0] ?? product.images[0]} alt="" className="w-6 h-6 object-cover rounded flex-shrink-0 opacity-80" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-gray-100 flex-shrink-0" />
                            )}
                            <span className="text-gray-600">{variant.name}</span>
                            <span className="ml-auto text-gray-500">{formatCurrency(variant.price ?? product.price)}</span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tabla de items */}
            {lineItems.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-600">Producto</th>
                      <th className="text-center p-2 font-medium text-gray-600 w-20">Cant.</th>
                      <th className="text-right p-2 font-medium text-gray-600 w-32">P. Unit.</th>
                      <th className="text-right p-2 font-medium text-gray-600 w-32">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item._key} className="border-t">
                        <td className="p-2">
                          <span className="font-medium">{item.productName}</span>
                          {item.variantName && (
                            <span className="text-gray-400 text-xs block">{item.variantName}</span>
                          )}
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item._key, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-16 text-center border rounded px-1 py-0.5 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => updateItem(item._key, 'price', Math.max(0, Number(e.target.value)))}
                            className="w-28 text-right border rounded px-1 py-0.5 text-sm"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-2">
                          <button onClick={() => removeItem(item._key)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {lineItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border rounded-md border-dashed">
                Busca y agrega productos a la orden
              </p>
            )}
          </section>

          {/* ── PAGO Y ENVÍO ── */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 border-b pb-1">
              Pago y Envío
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Método de pago</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="CASH_ON_DELIVERY">Contra Entrega</SelectItem>
                    <SelectItem value="WOMPI">Wompi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Costo de envío</Label>
                <Input
                  type="number"
                  min={0}
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas internas <span className="text-gray-400 text-xs">(opcional)</span></Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Cliente pagó por Nequi" />
            </div>
          </section>

          {/* ── TOTAL ── */}
          <div className="bg-gray-50 rounded-md p-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal productos</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t mt-1">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* ── ACCIONES ── */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={createManualOrder.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createManualOrder.isPending}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createManualOrder.isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
