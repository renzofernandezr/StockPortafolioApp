# Stock Portafolio

Dashboard para gestionar un portafolio de acciones con datos almacenados en Supabase y sincronización de precios desde la Bolsa de Valores de Lima (BVL).

## Qué hace la app

- Muestra métricas clave del portafolio (invertido, valor actual, ganancia/pérdida, posiciones activas).
- Visualiza gráficos de histórico de precios y evolución del valor del portafolio.
- Lista posiciones y operaciones en tablas detalladas.
- Sincroniza precios de la BVL al cargar la página mediante una API interna (`/api/bvl-sync`).

## Flujo de datos

1. El frontend llama a `/api/bvl-sync` al cargar la pantalla.
2. La API consulta la BVL por cada mnemónico activo.
3. Compara cuántos registros existen en Supabase para el día y cuáles faltan por hora.
4. Inserta solo los registros faltantes en `acciones_historial`.
5. El frontend refresca la UI para mostrar los nuevos datos.

## Requisitos

- Node.js
- Supabase con las tablas:
  - `acciones`
  - `acciones_operaciones`
  - `acciones_historial`
- Variables de entorno:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (necesaria para insertar en `acciones_historial`)

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Endpoints internos

- `GET /api/bvl-sync`: sincroniza precios desde la BVL y devuelve un resumen de la ejecución.
