CREATE TABLE public.acciones (
    nemonico        VARCHAR(20) PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    moneda          VARCHAR(10)  NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);


/* =========================================================
   TABLA HISTORIAL DE PRECIOS
========================================================= */
CREATE TABLE public.acciones_historial (
    id_historial BIGSERIAL PRIMARY KEY,
    nemonico     VARCHAR(20) NOT NULL,
    fecha_hora   TIMESTAMP WITH TIME ZONE NOT NULL,
    valor        NUMERIC(18,6) NOT NULL,

    CONSTRAINT fk_historial_accion
        FOREIGN KEY (nemonico)
        REFERENCES public.acciones (nemonico)
        ON DELETE CASCADE,

    CONSTRAINT uk_historial_accion_fecha
        UNIQUE (nemonico, fecha_hora)
);


/* =========================================================
   TABLA COMPRAS / VENTAS DE ACCIONES
========================================================= */
CREATE TABLE public.acciones_operaciones (
    id_operacion BIGSERIAL PRIMARY KEY,
    nemonico     VARCHAR(20) NOT NULL,
    fecha_hora   TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo         VARCHAR(10) NOT NULL, -- COMPRA / VENTA
    precio       NUMERIC(18,6) NOT NULL,
    cantidad     NUMERIC(18,6) NOT NULL,

    CONSTRAINT fk_operaciones_accion
        FOREIGN KEY (nemonico)
        REFERENCES public.acciones (nemonico)
        ON DELETE CASCADE,

    CONSTRAINT chk_tipo_operacion
        CHECK (tipo IN ('COMPRA', 'VENTA'))
);


/* =========================================================
   ÍNDICES (PERFORMANCE)
========================================================= */
CREATE INDEX idx_historial_nemonico_fecha
ON public.acciones_historial (nemonico, fecha_hora);

CREATE INDEX idx_operaciones_nemonico_fecha
ON public.acciones_operaciones (nemonico, fecha_hora);

CREATE INDEX idx_operaciones_fecha
ON public.acciones_operaciones (fecha_hora);


/* =========================================================
   ROW LEVEL SECURITY
========================================================= */
ALTER TABLE public.acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acciones_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acciones_operaciones ENABLE ROW LEVEL SECURITY;


/* =========================================================
   POLICIES — LECTURA
========================================================= */
CREATE POLICY "read acciones"
ON public.acciones
FOR SELECT
USING (true);

CREATE POLICY "read acciones_historial"
ON public.acciones_historial
FOR SELECT
USING (true);

CREATE POLICY "read acciones_operaciones"
ON public.acciones_operaciones
FOR SELECT
USING (true);


/* =========================================================
   POLICIES — ESCRITURA (USUARIOS AUTENTICADOS)
========================================================= */
CREATE POLICY "insert acciones auth"
ON public.acciones
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "insert historial auth"
ON public.acciones_historial
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "insert operaciones auth"
ON public.acciones_operaciones
FOR INSERT
TO authenticated
WITH CHECK (true);


/* =========================================================
   DATOS DE PRUEBA
========================================================= */
INSERT INTO public.acciones (nemonico, nombre_completo, moneda)
VALUES
('AAPL', 'Apple Inc.', 'USD'),
('MSFT', 'Microsoft Corporation', 'USD');

INSERT INTO public.acciones_historial (nemonico, fecha_hora, valor)
VALUES
('AAPL', '2026-01-28T15:53:59+00', 189.42),
('AAPL', '2026-01-28T16:53:59+00', 190.10),
('MSFT', '2026-01-28T15:53:59+00', 412.55);

INSERT INTO public.acciones_operaciones
(nemonico, fecha_hora, tipo, precio, cantidad)
VALUES
('AAPL', '2026-01-28T10:15:00+00', 'COMPRA', 185.50, 10),
('AAPL', '2026-02-10T14:30:00+00', 'VENTA', 195.20, 5),
('MSFT', '2026-02-01T09:45:00+00', 'COMPRA', 400.00, 3);


/* =========================================================
   QUERY DE VALIDACIÓN
========================================================= */
SELECT
    a.nemonico,
    a.nombre_completo,
    h.fecha_hora,
    h.valor
FROM public.acciones a
JOIN public.acciones_historial h
  ON h.nemonico = a.nemonico
ORDER BY a.nemonico, h.fecha_hora;
