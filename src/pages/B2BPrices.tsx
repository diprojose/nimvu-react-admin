import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useB2BProducts, useUpdateB2BPricesBulk } from '@/hooks/useB2BPrices';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';

export default function B2BPrices() {
  const { data: products, isLoading, error } = useB2BProducts();
  const { mutate: uploadPrices, isPending: isUploading } = useUpdateB2BPricesBulk();
  const [fileError, setFileError] = useState('');

  if (isLoading) return <div>Cargando productos B2B...</div>;
  if (error) return <div>Error al cargar productos B2B</div>;

  const handleExport = () => {
    if (!products) return;

    const data = products.map((product) => {
      // Find prices if they exist
      const p12 = product.b2bPrices?.find(p => p.minQuantity === 12);
      const p50 = product.b2bPrices?.find(p => p.minQuantity === 50);
      const p200 = product.b2bPrices?.find(p => p.minQuantity === 200);
      // We assume if one exists, we use its isActive state, else default true
      const isActive = product.b2bPrices && product.b2bPrices.length > 0 ? product.b2bPrices[0].isActive : true;

      return {
        'ID de Producto': product.id,
        'Nombre': product.name,
        'Precio Detal': product.price,
        'Precio B2B (12 unid.)': p12 ? p12.price : 0,
        'Precio B2B (50 unid.)': p50 ? p50.price : 0,
        'Precio B2B (200 unid.)': p200 ? p200.price : 0,
        'Activo': isActive ? 'VERDADERO' : 'FALSO'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Precios B2B');
    XLSX.writeFile(workbook, 'nimvu_b2b_prices.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError('');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        const pricesPayload = jsonData.map((row) => ({
          productId: row['ID de Producto']?.toString(),
          price12: parseFloat(row['Precio B2B (12 unid.)']) || 0,
          price50: parseFloat(row['Precio B2B (50 unid.)']) || 0,
          price200: parseFloat(row['Precio B2B (200 unid.)']) || 0,
          isActive: row['Activo'] === 'VERDADERO' || row['Activo'] === true
        })).filter(item => item.productId); // Filter out empty rows

        if (pricesPayload.length === 0) {
          setFileError("El archivo no contiene productos válidos. Verifica que no hayas borrado la columna 'ID de Producto'.");
          return;
        }

        uploadPrices({ prices: pricesPayload }, {
          onSuccess: () => {
            alert('Precios B2B actualizados correctamente.');
            // Reset input
            event.target.value = '';
          },
          onError: (err) => {
            setFileError('Error al subir los precios al servidor.');
            console.error(err);
          }
        });

      } catch (err) {
        console.error('Error parsing Excel', err);
        setFileError('Hubo un error al leer el archivo Excel. Asegúrate de que el formato sea correcto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Precios B2B</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar a Excel
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar desde Excel
            </Button>
          </div>
        </div>
      </div>

      {fileError && <div className="text-red-500 font-medium">{fileError}</div>}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Precio Detal</TableHead>
              <TableHead>Precio B2B (12)</TableHead>
              <TableHead>Precio B2B (50)</TableHead>
              <TableHead>Precio B2B (200)</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => {
              const p12 = product.b2bPrices?.find(p => p.minQuantity === 12);
              const p50 = product.b2bPrices?.find(p => p.minQuantity === 50);
              const p200 = product.b2bPrices?.find(p => p.minQuantity === 200);
              const isActive = product.b2bPrices && product.b2bPrices.length > 0 ? product.b2bPrices[0].isActive : false;
              const hasPrices = p12 || p50 || p200;

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>${product.price.toLocaleString()}</TableCell>
                  <TableCell>${p12 ? p12.price.toLocaleString() : '-'}</TableCell>
                  <TableCell>${p50 ? p50.price.toLocaleString() : '-'}</TableCell>
                  <TableCell>${p200 ? p200.price.toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${!hasPrices ? 'bg-gray-100 text-gray-800' :
                      isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {!hasPrices ? 'Sin precios' : isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
