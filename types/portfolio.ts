export interface Accion {
  nemonico: string;
  nombre_completo: string;
  moneda: string;
  created_at: string;
}

export interface AccionesHistorial {
  id_historial: number;
  nemonico: string;
  fecha_hora: string;
  valor: string;
}

export interface AccionesOperaciones {
  id_operacion: number;
  nemonico: string;
  fecha_hora: string;
  tipo: 'COMPRA' | 'VENTA';
  precio: string;
  cantidad: string;
  monto_total: string;
}

export interface Holding {
  id: string;
  symbol: string;
  company: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
}

export interface StockPricePoint {
  time: string;
  price: number;
  symbol: string;
}

export interface PortfolioDataPoint {
  date: string;
  portfolio: number;
}
