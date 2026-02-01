'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip } from 'recharts';
import { formatMoney } from '@/lib/utils';

interface PortfolioData {
  time: string;
  date?: string;
  displayLabel?: string;
  portfolioValue: number;
  symbol?: string;
}

interface PortfolioChartProps {
  data: PortfolioData[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [isTableOpen, setIsTableOpen] = useState(false);

  const getPeriodData = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('es-PE', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Lima'
    });
    
    if (period === 'day') {
      const todayData = data.filter(d => d.date === todayStr);
      // Si no hay datos de hoy, mostrar el último registro disponible (cierre del día anterior)
      if (todayData.length === 0 && data.length > 0) {
        const lastRecord = data[data.length - 1];
        return [lastRecord];
      }
      return todayData;
    } else if (period === 'week') {
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return data.filter(d => {
        if (!d.date) return false;
        const [day, month, year] = d.date.split('/');
        const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
        const dataDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        return dataDate >= sevenDaysAgo && dataDate <= today;
      });
    } else if (period === 'month') {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return data.filter(d => {
        if (!d.date) return false;
        const [day, month, year] = d.date.split('/');
        const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
        const dataDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        return dataDate >= thirtyDaysAgo && dataDate <= today;
      });
    }
    return data;
  };

  const transformedData = useMemo(() => {
    const baseData = getPeriodData();
    
    if (period === 'day') {
      return baseData.map((d) => ({
        ...d,
        displayLabel: d.time,
      }));
    } else {
      const groupedByDay = new Map();
      baseData.forEach((d) => {
        const key = d.date;
        if (!groupedByDay.has(key)) {
          groupedByDay.set(key, d);
        } else {
          groupedByDay.set(key, d);
        }
      });
      
      return Array.from(groupedByDay.values()).map((d) => ({
        ...d,
        displayLabel: d.date || d.time,
      }));
    }
  }, [period, data]);

  const filteredData = transformedData;

  const percentMap = useMemo(() => {
    if (filteredData.length === 0) return new Map<string, number>();
    const baseValue = filteredData[0]?.portfolioValue || 0;
    const map = new Map<string, number>();
    filteredData.forEach((row) => {
      const key = `${row.date ?? ''}|${row.time}`;
      const percent = baseValue > 0 ? ((row.portfolioValue - baseValue) / baseValue) * 100 : 0;
      map.set(key, percent);
    });
    return map;
  }, [filteredData]);

  const getYAxisDomain = () => {
    if (filteredData.length === 0) return ['dataMin', 'dataMax'];
    
    const minValue = Math.min(...filteredData.map(d => d.portfolioValue));
    const maxValue = Math.max(...filteredData.map(d => d.portfolioValue));
    const range = maxValue - minValue;
    const padding = range === 0 ? 1 : range * 0.1;
    
    return [Math.max(0, minValue - padding), maxValue + padding];
  };

  const minValue = filteredData.length > 0 ? Math.min(...filteredData.map(d => d.portfolioValue)) : 0;
  const maxValue = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.portfolioValue)) : 0;
  const currentValue = filteredData[filteredData.length - 1]?.portfolioValue || 0;
  const previousValue = filteredData[0]?.portfolioValue || 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100).toFixed(2) : '0.00';
  const isUp = change >= 0;

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <CardTitle className="text-foreground">Valor del Portafolio</CardTitle>
              <CardDescription>Evolución del valor total de tu portafolio en el tiempo</CardDescription>
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
              <span className="text-3xl font-bold text-foreground">${formatMoney(currentValue)}</span>
              <span className={`text-lg font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{formatMoney(change)} ({changePercent}%)
              </span>
            </div>
            <div className="ml-auto space-y-1 text-sm text-muted-foreground">
              <div>
                Máximo: <span className="text-foreground font-semibold">${formatMoney(maxValue)}</span>
              </div>
              <div>
                Mínimo: <span className="text-foreground font-semibold">${formatMoney(minValue)}</span>
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
                tickFormatter={(value) => `$${value.toFixed(0)}`}
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
                    const key = `${data.date ?? ''}|${data.time}`;
                    const percent = percentMap.get(key) ?? 0;
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
                          Valor: <span className="text-green-400 font-bold">${formatMoney(data.portfolioValue)}</span>
                        </p>
                        <p className="text-sm text-foreground">
                          Cambio %: <span className={percent >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                            {percent >= 0 ? '+' : ''}{percent.toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="linear"
                dataKey="portfolioValue"
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
                name="Valor Portafolio"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Collapsible Data Table */}
      <Card className="bg-card mt-4">
        <button
          onClick={() => setIsTableOpen(!isTableOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              Ver detalle de datos del portafolio
            </h3>
          </div>
          <ChevronDown
            size={20}
            className={`text-muted-foreground transition-transform duration-300 ${
              isTableOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isTableOpen && (
          <div className="border-t border-border">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hora</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor Portafolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">{row.date || row.time}</td>
                        <td className="py-3 px-4 text-foreground">{row.time}</td>
                        <td className="text-right py-3 px-4 text-foreground font-semibold">
                          ${formatMoney(row.portfolioValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </>
  );
}
