ALTER TABLE public.acciones_operaciones
ADD COLUMN monto_total NUMERIC(18,6) NOT NULL DEFAULT 0;

-- Actualizar los valores existentes calculando monto_total = precio * cantidad
UPDATE public.acciones_operaciones
SET monto_total = precio * cantidad
WHERE monto_total = 0;
