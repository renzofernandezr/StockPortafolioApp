import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables (SUPABASE_SERVICE_ROLE_KEY required)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BVL_ENDPOINT = 'https://dataondemand.bvl.com.pe/v1/stock-quote/daily';

function getPeruDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

function getPeruDayUtcRange(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startUtc = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0, 0));
  return { startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString() };
}

function getUtcHourKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(',', '');
}

function getHourKeyFromApi(lastDate: string): string {
  const match = lastDate.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return getUtcHourKey(new Date(lastDate));
}

async function getMemonicos() {
  const { data: acciones, error: accionesError } = await supabase
    .from('acciones')
    .select('nemonico')
    .order('created_at', { ascending: false });

  if (accionesError) {
    throw accionesError;
  }

  const fromAcciones = (acciones || [])
    .map((row: { nemonico: string }) => row.nemonico)
    .filter(Boolean);

  if (fromAcciones.length > 0) {
    return Array.from(new Set(fromAcciones));
  }

  const { data: operaciones, error: operacionesError } = await supabase
    .from('acciones_operaciones')
    .select('nemonico')
    .order('fecha_hora', { ascending: false });

  if (operacionesError) {
    throw operacionesError;
  }

  const fromOperaciones = (operaciones || [])
    .map((row: { nemonico: string }) => row.nemonico)
    .filter(Boolean);

  return Array.from(new Set(fromOperaciones));
}

async function fetchBvlDaily(nemonico: string, today: string) {
  const url = new URL(BVL_ENDPOINT);
  url.searchParams.set('nemonico', nemonico);
  url.searchParams.set('today', today);

  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BVL error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function GET() {
  const now = new Date();

  const today = getPeruDateString(now);
  const { startUtc, endUtc } = getPeruDayUtcRange(today);
  const memonicos = await getMemonicos();

  const summary = {
    executedAt: now.toISOString(),
    today,
    processed: memonicos.length,
    results: [] as Array<{
      nemonico: string;
      supabaseCount: number;
      bvlCount: number;
      synced: boolean;
      inserted: number;
      status: string;
      toInsert?: Array<{
        nemonico: string;
        fecha_hora: string;
        valor: number;
      }>;
      insertedValues?: Array<{
        nemonico: string;
        fecha_hora: string;
        valor: number;
      }>;
      data?: Array<{
        nemonico: string;
        fecha_hora: string;
        valor: number;
        hourKey: string;
      }>;
      error?: string;
    }>,
  };

  for (const nemonico of memonicos) {
    try {
      const bvlData = await fetchBvlDaily(nemonico, today);

      const normalizedBvl = bvlData
        .filter((row: any) => row?.lastDate && row?.lastValue)
        .map((row: any) => {
          return {
            nemonico: row.nemonico || nemonico,
            fecha_hora: row.lastDate,
            valor: Number(row.lastValue),
            hourKey: getHourKeyFromApi(row.lastDate),
          };
        });

      const { data: existingRows, error: existingError } = await supabase
        .from('acciones_historial')
        .select('fecha_hora')
        .eq('nemonico', nemonico)
        .gte('fecha_hora', startUtc)
        .lt('fecha_hora', endUtc);

      if (existingError) {
        throw existingError;
      }

      const supabaseCount = existingRows?.length || 0;
      const bvlCount = normalizedBvl.length;
      const synced = supabaseCount === bvlCount;
      const existingHourKeys = new Set(
        (existingRows || []).map((row: any) => getUtcHourKey(new Date(row.fecha_hora)))
      );

      const toInsert =
        supabaseCount === 0
          ? normalizedBvl
          : normalizedBvl.filter((row) => !existingHourKeys.has(row.hourKey));

      const insertPayload = toInsert.map(({ hourKey, ...row }) => row);

      if (insertPayload.length > 0) {
        const { error: insertError } = await supabase
          .from('acciones_historial')
          .insert(insertPayload);

        if (insertError) {
          throw insertError;
        }
      }

      summary.results.push({
        nemonico,
        supabaseCount,
        bvlCount,
        synced,
        inserted: insertPayload.length,
        status: 'fetched',
        toInsert: insertPayload,
        insertedValues: insertPayload.length > 0 ? insertPayload : [],
        data: normalizedBvl,
      });
    } catch (error: any) {
      summary.results.push({
        nemonico,
        supabaseCount: 0,
        bvlCount: 0,
        synced: false,
        inserted: 0,
        status: 'error',
        error: error?.message || 'Error desconocido',
      });
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Consultando a la Bolsa de Valores de Lima…',
    ...summary,
  });
}
