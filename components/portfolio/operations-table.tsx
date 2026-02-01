import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, formatPrice, formatQuantity } from '@/lib/utils';

interface Operation {
  id_operacion: number;
  nemonico: string;
  fecha_hora: string;
  tipo: 'COMPRA' | 'VENTA';
  precio: number;
  cantidad: number;
  monto_total: number;
}

interface Accion {
  nemonico: string;
  nombre_completo: string;
}

interface OperationsTableProps {
  operations: Operation[];
  acciones: Accion[];
}

export function OperationsTable({ operations, acciones }: OperationsTableProps) {
  // Crear un mapa para búsqueda rápida de nombres de acciones
  const accionesMap = new Map(acciones.map(a => [a.nemonico, a.nombre_completo]));

  // Ordenar operaciones por fecha descendente
  const sortedOperations = [...operations].sort(
    (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
  );

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Historial de Operaciones</CardTitle>
        <CardDescription>Registro de todas tus compras y ventas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-foreground font-semibold">Símbolo</TableHead>
                <TableHead className="text-foreground font-semibold">Empresa</TableHead>
                <TableHead className="text-foreground font-semibold">Tipo</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Precio</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Cantidad</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Total</TableHead>
                <TableHead className="text-foreground font-semibold">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOperations.length > 0 ? (
                sortedOperations.map((operation) => {
                  const isCompra = operation.tipo === 'COMPRA';
                  const empresaNombre = accionesMap.get(operation.nemonico) || 'Desconocido';
                  const dateObj = new Date(operation.fecha_hora);
                  const formattedDate = dateObj.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TableRow
                      key={operation.id_operacion}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-bold text-foreground">
                        {operation.nemonico}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {empresaNombre}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isCompra
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {isCompra ? 'COMPRA' : 'VENTA'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-foreground font-medium">
                        ${formatPrice(operation.precio)}
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        {formatQuantity(operation.cantidad)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        ${formatMoney(operation.monto_total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div>{formattedDate}</div>
                        <div className="text-xs text-muted-foreground">{formattedTime}</div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay operaciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
