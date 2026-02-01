'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockHistoryDataTable } from './stock-history-table';
import { Calculator } from 'lucide-react';

import { formatMoney, formatPrice, formatQuantity } from '@/lib/utils';

interface StockHistoryChartProps {
  data: Array<{
    time: string;
    date?: string;
    fullDateTime?: string;
    price: number;
    symbol: string;
  }>;
  acciones: Array<{
    nemonico: string;
    nombre_completo: string;
  }>;
  holdings?: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    purchasePrice?: number;
  }>;
}

export function StockHistoryChart({ data, acciones, holdings = [] }: StockHistoryChartProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(acciones[0]?.nemonico || '');
  const [simulatedPrice, setSimulatedPrice] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get quantity of selected stock
  const selectedHolding = holdings.find(h => h.symbol === selectedSymbol);
  const stockQuantity = selectedHolding?.quantity || 0;
  const purchasePrice = selectedHolding?.purchasePrice ?? 0;
  const investedValue = purchasePrice > 0 ? purchasePrice * stockQuantity : 0;

  // Filter data by selected symbol and format based on period
  const symbolData = useMemo(() => {
    return data.filter(d => d.symbol === selectedSymbol);
  }, [data, selectedSymbol]);

  const getPeriodData = () => {
    const today = new Date();
    // Crear fecha de hoy en el mismo formato que viene de los datos (DD/MM/YY)
    const todayStr = today.toLocaleDateString('es-PE', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Lima'
    });
    
    if (period === 'day') {
      // Filter only today's data by comparing dates
      const todayData = symbolData.filter(d => d.date === todayStr);
      // Si no hay datos de hoy, mostrar el último registro disponible (cierre del día anterior)
      if (todayData.length === 0 && symbolData.length > 0) {
        const lastRecord = symbolData[symbolData.length - 1];
        return [lastRecord];
      }
      return todayData;
    } else if (period === 'week') {
      // Filter data from the last 7 days
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return symbolData.filter(d => {
        if (!d.date) return false;
        const [day, month, year] = d.date.split('/');
        const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
        const dataDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate <= today;
      });
    } else if (period === 'month') {
      // Filter data from the last 30 days
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return symbolData.filter(d => {
        if (!d.date) return false;
        const [day, month, year] = d.date.split('/');
        const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
        const dataDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        return dataDate >= thirtyDaysAgo && dataDate <= today;
      });
    }
    return symbolData;
  };

  // Transform data to add formatted display labels
  const filteredData = useMemo(() => {
    const baseData = getPeriodData();
    
    if (period === 'day') {
      // For "Hoy", show only hour (HH:MM)
      return baseData.map((d) => ({
        ...d,
        displayLabel: d.time,
      }));
    } else {
      // For "Semana", "Mes", "Todo", group by day and take last value
      const groupedByDay = new Map();
      baseData.forEach((d) => {
        const key = d.date;
        if (!groupedByDay.has(key)) {
          groupedByDay.set(key, d);
        } else {
          // Keep the last (most recent) value for each day
          groupedByDay.set(key, d);
        }
      });
      
      return Array.from(groupedByDay.values()).map((d) => ({
        ...d,
        displayLabel: d.date || d.time,
      }));
    }
  }, [period, selectedSymbol, symbolData]);

  // Calculate dynamic scale padding based on period
  const getYAxisDomain = () => {
    if (filteredData.length === 0) return ['dataMin', 'dataMax'];
    
    const minPrice = Math.min(...filteredData.map(d => d.price));
    const maxPrice = Math.max(...filteredData.map(d => d.price));
    const range = maxPrice - minPrice;
    const padding = range === 0 ? 1 : range * 0.1;
    
    return [Math.max(0, minPrice - padding), maxPrice + padding];
  };

  const minPrice = filteredData.length > 0 ? Math.min(...filteredData.map(d => d.price)) : 0;
  const maxPrice = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.price)) : 0;
  const currentPrice = filteredData[filteredData.length - 1]?.price || 0;
  const previousPrice = filteredData[0]?.price || 0;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice > 0 ? ((change / previousPrice) * 100).toFixed(2) : '0.00';
  const isUp = change >= 0;

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <CardTitle className="text-foreground">{selectedSymbol} - Histórico de Precio</CardTitle>
              <CardDescription>Movimiento de precio en el período seleccionado</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Select value={selectedSymbol} onValueChange={(value) => {
                setSelectedSymbol(value);
                setSimulatedPrice('');
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Seleccionar acción" />
                </SelectTrigger>
                <SelectContent>
                  {acciones.map(accion => (
                    <SelectItem key={accion.nemonico} value={accion.nemonico}>
                      {accion.nemonico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent w-40">
                    <Calculator size={16} />
                    Simular
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Simulador de Precio - {selectedSymbol}</DialogTitle>
                    <DialogDescription>
                      Ingresa el precio objetivo para calcular el valor potencial de tu posición.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Precio Actual</Label>
                      <div className="text-2xl font-bold text-foreground">
                        ${formatMoney(currentPrice)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad de Acciones</Label>
                      <div className="text-2xl font-bold text-foreground">
                        {formatMoney(stockQuantity)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Actual de tu Posición</Label>
                      <div className="text-2xl font-bold text-primary">
                        ${formatMoney(currentPrice * stockQuantity)}
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 space-y-2">
                      <Label htmlFor="simulated-price">Precio Objetivo ($)</Label>
                      <Input
                        id="simulated-price"
                        type="number"
                        step="0.01"
                        placeholder="Ej: 200.00"
                        value={simulatedPrice}
                        onChange={(e) => setSimulatedPrice(e.target.value)}
                        className="text-lg"
                      />
                    </div>
                    {simulatedPrice && parseFloat(simulatedPrice) > 0 && (
                      <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
                        {investedValue > 0 && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">Monto Invertido</Label>
                            <div className="text-lg font-semibold text-foreground">
                              ${formatMoney(investedValue)}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Valor Simulado de tu Posición</Label>
                          <div className="text-3xl font-bold text-green-400">
                            ${formatMoney(parseFloat(simulatedPrice) * stockQuantity)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Ganancia/Pérdida Potencial</Label>
                          {(() => {
                            const simulatedValue = parseFloat(simulatedPrice) * stockQuantity;
                            const baseValue = investedValue > 0 ? investedValue : currentPrice * stockQuantity;
                            const delta = simulatedValue - baseValue;
                            const percent = baseValue > 0 ? (delta / baseValue) * 100 : 0;
                            const isUp = delta >= 0;
                            return (
                              <div className={`text-xl font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                {isUp ? '+' : ''}
                                ${formatMoney(delta)}
                                {' '}
                                ({percent.toFixed(2)}%)
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('day')}
              className={period === 'day' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            >
              Hoy
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
              className={period === 'week' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            >
              Semana
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
              className={period === 'month' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            >
              Mes
            </Button>
            <Button
              variant={period === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('all')}
              className={period === 'all' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            >
              Todo
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-baseline gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">${formatPrice(currentPrice)}</span>
              <span className={`text-lg font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{formatPrice(change)} ({changePercent}%)
              </span>
            </div>
            <div className="ml-auto space-y-1 text-sm text-muted-foreground">
              <div>
                Máximo: <span className="text-foreground font-semibold">${formatPrice(maxPrice)}</span>
              </div>
              <div>
                Mínimo: <span className="text-foreground font-semibold">${formatPrice(minPrice)}</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
              <XAxis 
                dataKey={period === 'day' ? 'time' : 'displayLabel'} 
                stroke="oklch(0.65 0 0)" 
                style={{ fontSize: '12px' }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="oklch(0.65 0 0)"
                style={{ fontSize: '12px' }}
                domain={getYAxisDomain()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.16 0 0)',
                  border: '1px solid oklch(0.22 0 0)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: 'oklch(0.95 0 0)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg bg-card border border-border p-3 shadow-lg">
                        {period !== 'day' && (
                          <p className="text-sm text-muted-foreground font-semibold mb-1">
                            Día: <span className="text-primary">{data.date}</span>
                          </p>
                        )}
                        <p className="text-sm text-foreground font-semibold">
                          Hora: <span className="text-primary">{data.time}</span>
                        </p>
                        <p className="text-sm text-foreground">
                          Precio: <span className="text-green-400 font-bold">${formatPrice(data.price)}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="linear"
                dataKey="price"
                stroke="oklch(0.55 0.16 263)"
                strokeWidth={2}
                dot={{
                  fill: 'oklch(0.55 0.16 263)',
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: 'oklch(0.6 0.18 263)',
                }}
                name="Precio"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <StockHistoryDataTable data={filteredData} period={period} />
    </>
  );
}
