CREATE TABLE IF NOT EXISTS public.dutch_cities (
  name text PRIMARY KEY,
  region text NOT NULL
);

INSERT INTO public.dutch_cities (name, region) VALUES
  ('Amsterdam', 'North Holland'),
  ('Rotterdam', 'South Holland'),
  ('Den Haag', 'South Holland'),
  ('Utrecht', 'Utrecht'),
  ('Eindhoven', 'North Brabant'),
  ('Groningen', 'Groningen'),
  ('Tilburg', 'North Brabant'),
  ('Almere', 'Flevoland'),
  ('Breda', 'North Brabant'),
  ('Nijmegen', 'Gelderland'),
  ('Enschede', 'Overijssel'),
  ('Haarlem', 'North Holland'),
  ('Arnhem', 'Gelderland'),
  ('Zaanstad', 'North Holland'),
  ('Amersfoort', 'Utrecht'),
  ('Apeldoorn', 'Gelderland'),
  ('Hoofddorp', 'North Holland'),
  ('Maastricht', 'Limburg'),
  ('Leiden', 'South Holland'),
  ('Dordrecht', 'South Holland'),
  ('Zoetermeer', 'South Holland'),
  ('Zwolle', 'Overijssel'),
  ('Deventer', 'Overijssel'),
  ('Leeuwarden', 'Friesland'),
  ('Delft', 'South Holland'),
  ('Heerlen', 'Limburg'),
  ('Alkmaar', 'North Holland'),
  ('Venlo', 'Limburg'),
  ('Helmond', 'North Brabant'),
  ('Hilversum', 'North Holland')
ON CONFLICT (name) DO UPDATE
SET region = EXCLUDED.region;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.advisors a
    LEFT JOIN public.dutch_cities dc ON dc.name = a.city
    WHERE dc.name IS NULL
  ) THEN
    RAISE EXCEPTION 'Found advisors.city values outside public.dutch_cities. Clean data before adding FK.';
  END IF;
END $$;

UPDATE public.advisors a
SET region = dc.region,
    country = 'NL'
FROM public.dutch_cities dc
WHERE dc.name = a.city
  AND (a.region IS DISTINCT FROM dc.region OR a.country IS DISTINCT FROM 'NL');

ALTER TABLE public.advisors
  ALTER COLUMN country SET DEFAULT 'NL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisors_city_fkey'
  ) THEN
    ALTER TABLE public.advisors
      ADD CONSTRAINT advisors_city_fkey
      FOREIGN KEY (city)
      REFERENCES public.dutch_cities(name);
  END IF;
END $$;
