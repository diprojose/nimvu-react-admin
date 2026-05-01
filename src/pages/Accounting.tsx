import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import type { ExpenseCategory } from '@/types';
import { format, parseISO, isThisMonth, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FILAMENT: 'Filamento',
  PACKAGING: 'Empaque',
  ADVERTISING: 'Publicidad',
  SHIPPING: 'Envíos',
  TOOLS: 'Herramientas',
  MAINTENANCE: 'Mantenimiento',
  SOFTWARE: 'Software',
  OTHER: 'Otro',
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  FILAMENT: 'bg-blue-100 text-blue-800',
  PACKAGING: 'bg-amber-100 text-amber-800',
  ADVERTISING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-indigo-100 text-indigo-800',
  TOOLS: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  SOFTWARE: 'bg-cyan-100 text-cyan-800',
  OTHER: 'bg-stone-100 text-stone-800',
};

type Tab = 'income' | 'expenses';
type PeriodFilter = 'month' | 'year' | 'all';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function Accounting() {
  const [tab, setTab] = useState<Tab>('income');
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('FILAMENT');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formNotes, setFormNotes] = useState('');

  const { data: orders = [] } = useOrders();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const filterByPeriod = <T extends { date?: string; createdAt?: string }>(items: T[]) => {
    if (period === 'all') return items;
    return items.filter(item => {
      const d = parseISO((item as any).date || (item as any).createdAt);
      return period === 'month' ? isThisMonth(d) : isThisYear(d);
    });
  };

  // Income: delivered/non-cancelled orders
  const activeOrders = useMemo(
    () => filterByPeriod(orders.filter(o => o.status !== 'CANCELLED')),
    [orders, period]
  );
  const totalIncome = useMemo(
    () => activeOrders.reduce((sum, o) => sum + o.total, 0),
    [activeOrders]
  );

  // Expenses
  const filteredExpenses = useMemo(() => filterByPeriod(expenses), [expenses, period]);
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  // By category breakdown
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, total]) => ({ category: cat as ExpenseCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const profit = totalIncome - totalExpenses;

  const handleSubmit = () => {
    if (!formDesc || !formAmount) return;
    createExpense.mutate(
      {
        description: formDesc,
        amount: parseFloat(formAmount),
        category: formCategory,
        date: new Date(formDate).toISOString(),
        notes: formNotes || undefined,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setFormDesc('');
          setFormAmount('');
          setFormCategory('FILAMENT');
          setFormDate(format(new Date(), 'yyyy-MM-dd'));
          setFormNotes('');
        },
      },
    );
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      deleteExpense.mutate(id);
    }
  };

  const PERIOD_LABELS: Record<PeriodFilter, string> = {
    month: 'Este mes',
    year: 'Este año',
    all: 'Todo',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">Contabilidad</h1>
        <Button onClick={() => setIsFormOpen(true)} className="bg-black text-white hover:bg-gray-800 gap-2">
          <Plus className="h-4 w-4" />
          Agregar Gasto
        </Button>
      </div>

      {/* Period filters */}
      <div className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map(key => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {PERIOD_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">{activeOrders.length} órdenes activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} gastos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <DollarSign className={`h-4 w-4 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos - Gastos</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expensesByCategory.map(({ category, total }) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${(total / totalExpenses) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-28 text-right">{formatCurrency(total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab('income')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'income' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Ingresos ({activeOrders.length})
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'expenses' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Gastos ({filteredExpenses.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="rounded-md border bg-white">
        {tab === 'income' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-10">
                    No hay ingresos en este período
                  </TableCell>
                </TableRow>
              ) : (
                activeOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{format(parseISO(order.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>
                    <TableCell className="font-medium">{order.user?.name || 'Cliente'}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.paymentMethod === 'WHATSAPP'
                          ? 'bg-green-100 text-green-700'
                          : order.paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'bg-orange-100 text-orange-700'
                          : order.paymentMethod === 'MERCADO_LIBRE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {order.paymentMethod === 'WHATSAPP' ? 'WhatsApp'
                          : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Contra Entrega'
                          : order.paymentMethod === 'MERCADO_LIBRE' ? 'Mercado Libre'
                          : 'Wompi'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800'
                        : order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800'
                        : order.status === 'PACKED' ? 'bg-teal-100 text-teal-800'
                        : order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status === 'DELIVERED' ? 'Entregado' : order.status === 'SHIPPED' ? 'En camino' : order.status === 'PACKED' ? 'Empacado' : order.status === 'PROCESSING' ? 'En preparación' : 'Pendiente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Cargando gastos...</TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                    No hay gastos registrados en este período
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(parseISO(expense.date), 'dd MMM yyyy', { locale: es })}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[expense.category]}`}>
                        {CATEGORY_LABELS[expense.category]}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-500">{expense.notes || '—'}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* New Expense Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción *</label>
              <Input
                placeholder="Ej: Rollo PLA blanco 1kg"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Monto (COP) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha *</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Categoría *</label>
              <Select value={formCategory} onValueChange={v => setFormCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map(key => (
                    <SelectItem key={key} value={key}>{CATEGORY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notas</label>
              <Input
                placeholder="Notas opcionales..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formDesc || !formAmount || createExpense.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                {createExpense.isPending ? 'Guardando...' : 'Guardar Gasto'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
