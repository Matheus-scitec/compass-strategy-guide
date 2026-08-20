ALTER TABLE public.indicador
  ADD COLUMN IF NOT EXISTS limite_verde numeric,
  ADD COLUMN IF NOT EXISTS limite_atencao numeric;

ALTER TABLE public.indicador
  DROP CONSTRAINT IF EXISTS indicador_limites_coerentes;
ALTER TABLE public.indicador
  ADD CONSTRAINT indicador_limites_coerentes
  CHECK (limite_verde IS NULL OR limite_atencao IS NULL OR limite_verde >= limite_atencao);