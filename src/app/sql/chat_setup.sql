CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  guest_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_preview text
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL,
  sender_role text NOT NULL,
  body text NOT NULL,
  attachment_url text,
  attachment_kind text,
  attachment_cloudinary_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.chat_blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  guest_profile_id uuid NOT NULL,
  blocked_by_profile_id uuid NOT NULL,
  blocked_by_role text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  guest_profile_id uuid NOT NULL,
  reporter_profile_id uuid NOT NULL,
  reporter_role text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  reviewed_at timestamp with time zone,
  reviewed_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_messages_sender_role_check'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_sender_role_check
      CHECK (sender_role IN ('advisor', 'guest'));
  END IF;
END $$;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_kind text,
  ADD COLUMN IF NOT EXISTS attachment_cloudinary_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_messages_attachment_kind_check'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_attachment_kind_check
      CHECK (attachment_kind IS NULL OR attachment_kind IN ('image', 'video'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_blocks_blocked_by_role_check'
  ) THEN
    ALTER TABLE public.chat_blocks
      ADD CONSTRAINT chat_blocks_blocked_by_role_check
      CHECK (blocked_by_role IN ('advisor', 'guest'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_reports_reporter_role_check'
  ) THEN
    ALTER TABLE public.chat_reports
      ADD CONSTRAINT chat_reports_reporter_role_check
      CHECK (reporter_role IN ('advisor', 'guest'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_reports_status_check'
  ) THEN
    ALTER TABLE public.chat_reports
      ADD CONSTRAINT chat_reports_status_check
      CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_reports_reason_check'
  ) THEN
    ALTER TABLE public.chat_reports
      ADD CONSTRAINT chat_reports_reason_check
      CHECK (reason IN ('spam', 'abuse', 'scam', 'fake', 'other'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_advisor_guest_uidx
  ON public.chat_conversations (advisor_id, guest_profile_id);

CREATE INDEX IF NOT EXISTS chat_conversations_advisor_last_message_idx
  ON public.chat_conversations (advisor_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS chat_conversations_guest_last_message_idx
  ON public.chat_conversations (guest_profile_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS chat_conversations_last_message_idx
  ON public.chat_conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx
  ON public.chat_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS chat_messages_sender_created_idx
  ON public.chat_messages (sender_profile_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS chat_blocks_pair_idx
  ON public.chat_blocks (advisor_id, guest_profile_id);

CREATE INDEX IF NOT EXISTS chat_blocks_blocker_idx
  ON public.chat_blocks (blocked_by_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_reports_status_created_idx
  ON public.chat_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_reports_conversation_idx
  ON public.chat_reports (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_reports_reporter_idx
  ON public.chat_reports (reporter_profile_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_chat_conversation_from_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET
    updated_at = NEW.created_at,
    last_message_at = NEW.created_at,
    last_message_preview = left(NEW.body, 140)
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_touch_conversation ON public.chat_messages;

CREATE TRIGGER chat_messages_touch_conversation
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_chat_conversation_from_message();

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conversations_participants_select" ON public.chat_conversations;
CREATE POLICY "chat_conversations_participants_select"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  guest_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.advisors a
    WHERE a.id = advisor_id
      AND a.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "chat_messages_participants_select" ON public.chat_messages;
CREATE POLICY "chat_messages_participants_select"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    LEFT JOIN public.advisors a ON a.id = c.advisor_id
    WHERE c.id = conversation_id
      AND (
        c.guest_profile_id = auth.uid()
        OR a.profile_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "chat_blocks_participants_select" ON public.chat_blocks;
CREATE POLICY "chat_blocks_participants_select"
ON public.chat_blocks
FOR SELECT
TO authenticated
USING (
  guest_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.advisors a
    WHERE a.id = advisor_id
      AND a.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "chat_reports_participants_select" ON public.chat_reports;
CREATE POLICY "chat_reports_participants_select"
ON public.chat_reports
FOR SELECT
TO authenticated
USING (
  reporter_profile_id = auth.uid()
  OR guest_profile_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.advisors a
    WHERE a.id = advisor_id
      AND a.profile_id = auth.uid()
  )
);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
