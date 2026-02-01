'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface StockHistoryTableProps {
  data: Array<{
    time: string;
    date?: string;
    fullDateTime?: string;
    price: number;
    symbol: string;
    displayLabel?: string;
  }>;
  period: 'day' | 'week' | 'month' | 'all';
}

export function StockHistoryDataTable({ data, period }: StockHistoryTableProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-card mt-6">
        <CardHeader>
          <CardTitle>Datos del Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card mt-6">
      <CardHeader>
        <CardTitle>Datos del Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-foreground font-semibold">Fecha</TableHead>
                <TableHead className="text-foreground font-semibold">Hora</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={index}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-foreground">{item.date || 'N/A'}</TableCell>
                  <TableCell className="text-foreground">{item.time}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ${formatPrice(item.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
