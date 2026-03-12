-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.advisor_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL,
  cloudinary_id text NOT NULL,
  url text NOT NULL,
  media_type USER-DEFINED NOT NULL DEFAULT 'photo'::media_type,
  is_cover boolean DEFAULT false,
  is_private boolean DEFAULT false,
  sort_order smallint DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT advisor_media_pkey PRIMARY KEY (id),
  CONSTRAINT advisor_media_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id)
);
CREATE TABLE public.advisors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  advisor_category text NOT NULL DEFAULT 'woman'::text CHECK (advisor_category = ANY (ARRAY['woman'::text, 'man'::text, 'couple'::text, 'shemale'::text])),
  bio text,
  city text NOT NULL,
  region text,
  country text NOT NULL DEFAULT 'NL'::text,
  latitude numeric,
  longitude numeric,
  age smallint CHECK (age >= 18 AND age <= 80),
  gender USER-DEFINED NOT NULL DEFAULT 'female'::gender_type,
  height_cm smallint,
  weight_kg smallint,
  eye_color text,
  hair_color text,
  ethnicity text,
  sexual_orientation text,
  availability USER-DEFINED DEFAULT 'both'::availability_type,
  date_types ARRAY DEFAULT '{}'::text[],
  languages ARRAY DEFAULT '{it}'::text[],
  services_tags ARRAY DEFAULT '{}'::text[],
  incall_rates jsonb DEFAULT '[]'::jsonb,
  outcall_rates jsonb DEFAULT '[]'::jsonb,
  availability_slots ARRAY DEFAULT '{}'::text[],
  phone text,
  whatsapp_available boolean DEFAULT false,
  telegram_available boolean DEFAULT false,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::advisor_status,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  contacts_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT advisors_pkey PRIMARY KEY (id),
  CONSTRAINT advisors_city_fkey FOREIGN KEY (city) REFERENCES public.dutch_cities(name)
);
CREATE TABLE public.cities (
  id text NOT NULL,
  name text NOT NULL,
  count integer DEFAULT 0,
  region text,
  CONSTRAINT cities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dutch_cities (
  name text NOT NULL,
  region text NOT NULL,
  CONSTRAINT dutch_cities_pkey PRIMARY KEY (name)
);
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  wallet_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type USER-DEFINED NOT NULL,
  description text,
  reference_id uuid,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT credit_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.credit_wallets(id)
);
CREATE TABLE public.credit_wallets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_wallets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  advisor_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'New User'::text,
  age integer NOT NULL DEFAULT 18,
  city text NOT NULL DEFAULT 'Amsterdam'::text,
  district text,
  nationality text,
  languages ARRAY,
  phone text,
  description text DEFAULT ''::text,
  photos jsonb DEFAULT '[]'::jsonb,
  services ARRAY,
  attributes jsonb DEFAULT '{}'::jsonb,
  rates jsonb DEFAULT '[]'::jsonb,
  availability text DEFAULT 'available'::text,
  is_verified boolean DEFAULT false,
  is_online boolean DEFAULT false,
  subscription_level text DEFAULT 'free'::text,
  views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reporter_id uuid,
  advisor_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::report_status,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL,
  tier USER-DEFINED NOT NULL DEFAULT 'free'::subscription_tier,
  status USER-DEFINED NOT NULL DEFAULT 'active'::subscription_status,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  stripe_price_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id)
);
