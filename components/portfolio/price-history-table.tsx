'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PriceHistory {
  id: string;
  symbol: string;
  date: string;
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface PriceHistoryTableProps {
  history: PriceHistory[];
}

export function PriceHistoryTable({ history }: PriceHistoryTableProps) {
  const calculateDayChange = (open: number, close: number) => {
    return close - open;
  };

  const calculateDayChangePercent = (open: number, close: number) => {
    return ((close - open) / open) * 100;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return (volume / 1000000).toFixed(2) + 'M';
    if (volume >= 1000) return (volume / 1000).toFixed(2) + 'K';
    return volume.toString();
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Histórico de Precios</CardTitle>
        <CardDescription>Movimiento de precios por día</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-foreground">Símbolo</TableHead>
                <TableHead className="text-foreground">Fecha</TableHead>
                <TableHead className="text-right text-foreground">Apertura</TableHead>
                <TableHead className="text-right text-foreground">Cierre</TableHead>
                <TableHead className="text-right text-foreground">Máximo</TableHead>
                <TableHead className="text-right text-foreground">Mínimo</TableHead>
                <TableHead className="text-right text-foreground">Cambio</TableHead>
                <TableHead className="text-right text-foreground">% Cambio</TableHead>
                <TableHead className="text-right text-foreground">Volumen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => {
                const dayChange = calculateDayChange(record.open, record.close);
                const dayChangePercent = calculateDayChangePercent(record.open, record.close);
                const isUp = dayChange >= 0;

                return (
                  <TableRow key={record.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-semibold text-primary">{record.symbol}</TableCell>
                    <TableCell className="text-foreground text-sm">{record.date} {record.time}</TableCell>
                    <TableCell className="text-right text-foreground">${record.open.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-foreground font-semibold">${record.close.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">${record.high.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">${record.low.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isUp ? (
                          <ArrowUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className={isUp ? 'text-green-400' : 'text-red-400'}>
                          ${Math.abs(dayChange).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isUp ? 'default' : 'destructive'} className={isUp ? 'bg-green-900 text-green-100 hover:bg-green-800' : 'bg-red-900 text-red-100 hover:bg-red-800'}>
                        {isUp ? '+' : ''}{dayChangePercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground text-sm">{formatVolume(record.volume)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
