'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type SyncState = 'loading' | 'success' | 'error';

const STATUS_COPY: Record<SyncState, string> = {
  loading: 'Actualizando valores de la bolsa de valores.',
  success: 'Valores actualizados.',
  error: 'No se pudo actualizar los valores de la bolsa.',
};

export function BvlSyncStatus() {
  const [status, setStatus] = useState<SyncState>('loading');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const runSync = async () => {
      try {
        const response = await fetch('/api/bvl-sync', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Sync failed');
        }

        const payload = await response.json();
        console.log('Respuesta API /api/bvl-sync:', payload);
        if (payload?.results?.length) {
          const pending = payload.results
            .filter((item: any) => Array.isArray(item.toInsert) && item.toInsert.length > 0)
            .map((item: any) => ({
              nemonico: item.nemonico,
              valores: item.toInsert.map((row: any) => ({
                nemonico: row.nemonico,
                fecha_hora: row.fecha_hora,
                valor: row.valor,
              })),
            }));
          if (pending.length > 0) {
            console.log('Valores a agregar:', pending);
          }
          const inserted = payload.results
            .filter(
              (item: any) => Array.isArray(item.insertedValues) && item.insertedValues.length > 0
            )
            .map((item: any) => ({
              nemonico: item.nemonico,
              valores: item.insertedValues.map((row: any) => ({
                nemonico: row.nemonico,
                fecha_hora: row.fecha_hora,
                valor: row.valor,
              })),
            }));
          if (inserted.length > 0) {
            console.log('Valores insertados:', inserted);
          }
          payload.results.forEach((item: any) => {
            if (typeof item.supabaseCount === 'number') {
              console.log(
                `Cantidad de valores supabase hoy (${item.nemonico}) = ${item.supabaseCount}`
              );
            }
            if (typeof item.bvlCount === 'number') {
              console.log(
                `Cantidad de valores BVL hoy (${item.nemonico}) = ${item.bvlCount}`
              );
            }
          });
        }

        if (isMounted) {
          setStatus('success');
          router.refresh();
        }
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    runSync();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-sm text-muted-foreground">
      {status === 'loading' ? (
        <Loader2 size={14} className="animate-spin text-primary" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-primary" />
      )}
      <span>{STATUS_COPY[status]}</span>
    </div>
  );
}
