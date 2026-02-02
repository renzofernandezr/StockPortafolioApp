import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { OperationsTable } from '@/components/portfolio/operations-table';
import { StockHistoryChart } from '@/components/portfolio/stock-history-chart';
import { PortfolioChart } from '@/components/portfolio/portfolio-chart';
import { BvlSyncStatus } from '@/components/portfolio/bvl-sync-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAcciones, getAllAccionesHistorial, getAccionesOperaciones } from '@/lib/supabase';
import { formatMoney } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PortfolioDashboard() {
  try {
    // Fetch data from Supabase
    const acciones = await getAcciones();
    const accionesHistorial = await getAllAccionesHistorial();
    const accionesOperaciones = await getAccionesOperaciones();

    // Get current price for each acción (último valor en el histórico)
    const getCurrentPrice = (nemonico: string) => {
      const lastRecord = accionesHistorial
        .filter((record: any) => record.nemonico === nemonico)
        .sort((a: any, b: any) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())[0];
      return lastRecord?.valor ? parseFloat(lastRecord.valor) : 0;
    };

    // Calculate holdings from operations
    const holdingsMap = new Map();
    accionesOperaciones.forEach((op: any) => {
      const key = op.nemonico;
      if (!holdingsMap.has(key)) {
        holdingsMap.set(key, { comprado: 0, vendido: 0 });
      }
      const holdings = holdingsMap.get(key);
      if (op.tipo === 'COMPRA') {
        holdings.comprado += parseFloat(op.cantidad);
      } else {
        holdings.vendido += parseFloat(op.cantidad);
      }
    });

    // Transform data for holdings
    const holdingsData = acciones.map((accion: any, index: number) => {
      const holdings = holdingsMap.get(accion.nemonico) || { comprado: 0, vendido: 0 };
      const quantity = holdings.comprado - holdings.vendido;

      // Get average purchase price
      const purchaseOps = accionesOperaciones.filter(
        (op: any) => op.nemonico === accion.nemonico && op.tipo === 'COMPRA'
      );
      const totalCost = purchaseOps.reduce((sum: number, op: any) => sum + parseFloat(op.precio) * parseFloat(op.cantidad), 0);
      const totalQuantity = purchaseOps.reduce((sum: number, op: any) => sum + parseFloat(op.cantidad), 0);
      const avgPurchasePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      // Get first purchase date
      const firstPurchase = purchaseOps[purchaseOps.length - 1];
      const purchaseDate = firstPurchase ? new Date(firstPurchase.fecha_hora).toLocaleDateString() : '-';

      return {
        id: index.toString(),
        symbol: accion.nemonico,
        company: accion.nombre_completo,
        quantity: quantity,
        purchasePrice: avgPurchasePrice,
        purchaseDate: purchaseDate,
        currentPrice: getCurrentPrice(accion.nemonico),
      };
    }).filter((h: any) => h.quantity > 0); // Only show holdings with quantity > 0

    // Calculate portfolio totals
    const totalInvested = holdingsData.reduce((acc: number, h: any) => acc + (h.quantity * h.purchasePrice), 0);
    const totalCurrent = holdingsData.reduce((acc: number, h: any) => acc + (h.quantity * h.currentPrice), 0);
    const totalGainLoss = totalCurrent - totalInvested;
    const gainLossPercent = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(2) : '0.00';
    const isGain = totalGainLoss >= 0;

    // Generate price history data grouped by day
    const priceHistoryMap = new Map();
    accionesHistorial.forEach((record: any) => {
      const date = new Date(record.fecha_hora);
      const dateStr = date.toLocaleDateString();
      const key = `${record.nemonico}-${dateStr}`;

      if (!priceHistoryMap.has(key)) {
        priceHistoryMap.set(key, {
          symbol: record.nemonico,
          date: dateStr,
          prices: [parseFloat(record.valor)],
        });
      } else {
        priceHistoryMap.get(key).prices.push(parseFloat(record.valor));
      }
    });

    // Create mock stock price data for charts - Convert to Peru timezone (UTC-5)
    const mockStockPriceData = accionesHistorial.map((record: any) => {
      const utcDate = new Date(record.fecha_hora);
      const timeStr = utcDate.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Lima'
      });
      const dateStr = utcDate.toLocaleDateString('es-PE', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Lima'
      });
      return {
        time: timeStr,
        date: dateStr,
        fullDateTime: `${dateStr} ${timeStr}`,
        price: parseFloat(record.valor),
        symbol: record.nemonico,
      };
    });

    // Create portfolio value data based on stock prices and operations
    // Only show data points where user had holdings (after first purchase)
    const mockPortfolioData = mockStockPriceData
      .map((record: any) => {
        // Parse record date for comparison
        const [day, month, year] = record.date.split('/');
        const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
        const recordDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        
        // Calculate holdings at this point in time based on operations
        const holdingsAtTime: Record<string, number> = {};
        
        accionesOperaciones.forEach((op: any) => {
          const opDate = new Date(op.fecha_hora);
          if (opDate <= recordDate) {
            const cantidad = parseFloat(op.cantidad);
            if (op.tipo === 'COMPRA') {
              holdingsAtTime[op.nemonico] = (holdingsAtTime[op.nemonico] || 0) + cantidad;
            } else if (op.tipo === 'VENTA') {
              holdingsAtTime[op.nemonico] = (holdingsAtTime[op.nemonico] || 0) - cantidad;
            }
          }
        });
        
        // Calculate portfolio value at this time
        let portfolioValue = 0;
        Object.entries(holdingsAtTime).forEach(([symbol, quantity]) => {
          if (quantity > 0) {
            // Get price for this symbol at this time
            const priceData = mockStockPriceData.find(
              (d: any) => d.symbol === symbol && d.date === record.date && d.time === record.time
            );
            if (priceData) {
              portfolioValue += quantity * priceData.price;
            }
          }
        });

        return {
          time: record.time,
          date: record.date,
          portfolioValue: portfolioValue,
          symbol: record.symbol,
        };
      })
      .filter((d: any) => d.portfolioValue > 0);

    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
              Mi Portafolio de Acciones
            </h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona y visualiza tu cartera de inversiones en bolsa
            </p>
            <BvlSyncStatus />
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invertido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${formatMoney(totalInvested)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${formatMoney(totalCurrent)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ganancia/Pérdida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                  ${formatMoney(totalGainLoss)}
                </div>
                <p className={`text-xs mt-1 ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                  {gainLossPercent}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Posiciones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {holdingsData.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts in Tabs */}
          <div className="mb-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Análisis de Gráficos</CardTitle>
                <CardDescription>Visualiza el histórico de precios y el valor de tu portafolio</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stock-history" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stock-history">Histórico de Precio</TabsTrigger>
                    <TabsTrigger value="portfolio-value">Valor del Portafolio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="stock-history" className="mt-6">
                    <StockHistoryChart data={mockStockPriceData} acciones={acciones} holdings={holdingsData} />
                  </TabsContent>
                  <TabsContent value="portfolio-value" className="mt-6">
                    <PortfolioChart data={mockPortfolioData} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="space-y-6">
            <HoldingsTable holdings={holdingsData} />
            <OperationsTable operations={accionesOperaciones} acciones={acciones} />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-red-950 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-100">Error al cargar el dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-100">
                No se pudo conectar a Supabase. Por favor, verifica tus variables de entorno.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
}
