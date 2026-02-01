'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatPrice, formatQuantity } from '@/lib/utils';

interface Holding {
  id: string;
  symbol: string;
  company: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const calculateGainLoss = (quantity: number, purchasePrice: number, currentPrice: number) => {
    return (quantity * currentPrice) - (quantity * purchasePrice);
  };

  const calculateGainLossPercent = (purchasePrice: number, currentPrice: number) => {
    return ((currentPrice - purchasePrice) / purchasePrice) * 100;
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Mis Acciones</CardTitle>
        <CardDescription>Historial de compras y posiciones actuales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-foreground">Símbolo</TableHead>
                <TableHead className="text-foreground">Empresa</TableHead>
                <TableHead className="text-right text-foreground">Cantidad</TableHead>
                <TableHead className="text-right text-foreground">Precio Compra</TableHead>
                <TableHead className="text-right text-foreground">Fecha Compra</TableHead>
                <TableHead className="text-right text-foreground">Precio Actual</TableHead>
                <TableHead className="text-right text-foreground">Ganancia/Pérdida</TableHead>
                <TableHead className="text-right text-foreground">% Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => {
                const gainLoss = calculateGainLoss(holding.quantity, holding.purchasePrice, holding.currentPrice);
                const gainLossPercent = calculateGainLossPercent(holding.purchasePrice, holding.currentPrice);
                const isGain = gainLoss >= 0;

                return (
                  <TableRow key={holding.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-semibold text-primary">{holding.symbol}</TableCell>
                    <TableCell className="text-foreground">{holding.company}</TableCell>
                    <TableCell className="text-right text-foreground">{formatQuantity(holding.quantity)}</TableCell>
                    <TableCell className="text-right text-foreground">${formatPrice(holding.purchasePrice)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{holding.purchaseDate}</TableCell>
                    <TableCell className="text-right text-foreground font-semibold">${formatPrice(holding.currentPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isGain ? 'default' : 'destructive'} className={isGain ? 'bg-green-900 text-green-100 hover:bg-green-800' : 'bg-red-900 text-red-100 hover:bg-red-800'}>
                        ${formatMoney(gainLoss)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isGain ? 'text-green-400' : 'text-red-400'}>
                        {isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </span>
                    </TableCell>
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
