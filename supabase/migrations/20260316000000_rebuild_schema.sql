/*
  # Guardian Rebuild - Schema additions

  Adds new tables and columns for:
  - Quarters (quarter lifecycle management)
  - Announcements (broadcast + shift-specific messaging)
  - Scheduler runs (tracking auto-assignment runs)
  - Notification queue (email delivery queue)
  - Swap requests (volunteer shift swap workflow)

  Updates existing tables:
  - profiles: adds preference columns + onboarding flag
  - shifts: adds quarter_id, event_type, event_notes, status
  - shift_volunteers (shift_assignments): adds assignment_source
*/

-- =====================
-- QUARTERS
-- =====================
CREATE TABLE quarters (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  status               TEXT NOT NULL DEFAULT 'setup'
                         CHECK (status IN ('setup', 'preferences', 'scheduled', 'active', 'closed')),
  swap_deadline_hours  INTEGER NOT NULL DEFAULT 48,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (start_date)
);

ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quarters"
  ON quarters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage quarters"
  ON quarters FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================
-- UPDATE SHIFTS TABLE
-- =====================
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS quarter_id  UUID REFERENCES quarters(id),
  ADD COLUMN IF NOT EXISTS event_type  TEXT DEFAULT 'shabbat'
                                         CHECK (event_type IN ('shabbat', 'holiday', 'evening')),
  ADD COLUMN IF NOT EXISTS event_title TEXT,
  ADD COLUMN IF NOT EXISTS event_notes TEXT,
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'draft'
                                         CHECK (status IN ('draft', 'published'));

-- Remove Saturday-only constraint if it exists (may be in a trigger)
DROP TRIGGER IF EXISTS ensure_saturday_trigger ON shifts;
DROP FUNCTION IF EXISTS ensure_saturday();

-- =====================
-- UPDATE PROFILES TABLE
-- =====================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blackout_dates              DATE[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS partner_preferences         UUID[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notification_assignments    BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_changes        BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_announcements  BOOLEAN   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_complete         BOOLEAN   NOT NULL DEFAULT false;

-- Ensure preferred_shift has a 'none' option too
-- (the column already exists, we just update the check if needed)
-- No DDL needed since it's stored as TEXT

-- =====================
-- UPDATE SHIFT_ASSIGNMENTS (rename reference in code uses shift_assignments)
-- Add assignment_source
-- =====================
ALTER TABLE shift_assignments
  ADD COLUMN IF NOT EXISTS assignment_source TEXT NOT NULL DEFAULT 'self'
    CHECK (assignment_source IN ('auto', 'manual', 'self'));

-- =====================
-- ANNOUNCEMENTS
-- =====================
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id    UUID REFERENCES shifts(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view announcements"
  ON announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and TLs can post announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'TL')
    )
  );

CREATE POLICY "Authors can delete their own announcements"
  ON announcements FOR DELETE
  USING (auth.uid() = author_id);

-- =====================
-- SCHEDULER RUNS
-- =====================
CREATE TABLE scheduler_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter_id      UUID NOT NULL REFERENCES quarters(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result_summary  JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

ALTER TABLE scheduler_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scheduler runs"
  ON scheduler_runs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can manage scheduler runs"
  ON scheduler_runs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================
-- NOTIFICATION QUEUE
-- =====================
CREATE TABLE notification_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type   TEXT NOT NULL
                        CHECK (notification_type IN ('assignment', 'change', 'announcement', 'swap_open', 'swap_matched', 'swap_confirmed', 'swap_expired')),
  payload             JSONB NOT NULL DEFAULT '{}',
  sent_at             TIMESTAMPTZ,
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) can access notification_queue
-- Admins can read for debugging
CREATE POLICY "Admins can view notification queue"
  ON notification_queue FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================
-- SWAP REQUESTS
-- =====================
CREATE TABLE swap_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id          UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  offered_shift_id  UUID REFERENCES shifts(id) ON DELETE SET NULL,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'matched', 'confirmed', 'cancelled', 'expired')),
  responder_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view swap requests"
  ON swap_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Volunteers can create swap requests for their own shifts"
  ON swap_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (
      SELECT 1 FROM shift_assignments
      WHERE user_id = auth.uid()
        AND shift_id = swap_requests.shift_id
    )
  );

CREATE POLICY "Requester or responder can update their swap request"
  ON swap_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = responder_id);

CREATE POLICY "Admins can manage all swap requests"
  ON swap_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_shifts_quarter_id     ON shifts(quarter_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status         ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_announcements_shift   ON announcements(shift_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_requests_shift   ON swap_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status  ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_notif_queue_sent      ON notification_queue(sent_at) WHERE sent_at IS NULL;

-- =====================
-- TRIGGER: notify on announcement
-- =====================
CREATE OR REPLACE FUNCTION notify_on_announcement()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all users who want announcement emails
  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT
    p.id,
    'announcement',
    jsonb_build_object(
      'announcement_id', NEW.id,
      'author_id', NEW.author_id,
      'body', LEFT(NEW.body, 200),
      'shift_id', NEW.shift_id
    )
  FROM profiles p
  WHERE p.notification_announcements = true
    AND p.id != NEW.author_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_announcement
  AFTER INSERT ON announcements
  FOR EACH ROW EXECUTE FUNCTION notify_on_announcement();

-- =====================
-- TRIGGER: notify on assignment
-- =====================
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notification_queue (user_id, notification_type, payload)
    SELECT
      NEW.user_id,
      'assignment',
      jsonb_build_object(
        'shift_id', NEW.shift_id,
        'assignment_source', NEW.assignment_source
      )
    FROM profiles p
    WHERE p.id = NEW.user_id
      AND p.notification_assignments = true;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notification_queue (user_id, notification_type, payload)
    SELECT
      OLD.user_id,
      'change',
      jsonb_build_object(
        'shift_id', OLD.shift_id,
        'change_type', 'removed'
      )
    FROM profiles p
    WHERE p.id = OLD.user_id
      AND p.notification_changes = true;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_assignment
  AFTER INSERT OR DELETE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

-- =====================
-- FUNCTION: confirm_swap
-- Called when both parties confirm a matched swap request.
-- Atomically swaps shift_assignments and marks the request confirmed.
-- =====================
CREATE OR REPLACE FUNCTION confirm_swap(p_swap_id UUID)
RETURNS void AS $$
DECLARE
  v_swap        swap_requests%ROWTYPE;
  v_offered_id  UUID;
BEGIN
  -- Lock and fetch the swap request
  SELECT * INTO v_swap FROM swap_requests WHERE id = p_swap_id FOR UPDATE;

  IF v_swap.status NOT IN ('open', 'matched') THEN
    RAISE EXCEPTION 'Swap % is not in a confirmable state (status: %)', p_swap_id, v_swap.status;
  END IF;

  IF v_swap.responder_id IS NULL THEN
    RAISE EXCEPTION 'Swap % has no responder yet', p_swap_id;
  END IF;

  -- Remove requester from their shift
  DELETE FROM shift_assignments
  WHERE shift_id = v_swap.shift_id AND user_id = v_swap.requester_id;

  -- Add responder to the requester's shift
  INSERT INTO shift_assignments (shift_id, user_id, assignment_source)
  SELECT v_swap.shift_id, v_swap.responder_id, 'manual'
  ON CONFLICT (shift_id, user_id) DO NOTHING;

  -- If there is an offered shift, do the reciprocal swap
  IF v_swap.offered_shift_id IS NOT NULL THEN
    DELETE FROM shift_assignments
    WHERE shift_id = v_swap.offered_shift_id AND user_id = v_swap.responder_id;

    INSERT INTO shift_assignments (shift_id, user_id, assignment_source)
    SELECT v_swap.offered_shift_id, v_swap.requester_id, 'manual'
    ON CONFLICT (shift_id, user_id) DO NOTHING;
  END IF;

  -- Mark the swap confirmed
  UPDATE swap_requests SET status = 'confirmed' WHERE id = p_swap_id;

  -- Queue confirmed notifications for both parties
  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT unnest(ARRAY[v_swap.requester_id, v_swap.responder_id]),
         'swap_confirmed',
         jsonb_build_object('swap_id', p_swap_id, 'shift_id', v_swap.shift_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- TRIGGER: notify on swap_requests INSERT (open) → eligible volunteers
-- =====================
CREATE OR REPLACE FUNCTION notify_on_swap_open()
RETURNS TRIGGER AS $$
DECLARE
  v_shift  shifts%ROWTYPE;
BEGIN
  IF NEW.status != 'open' THEN RETURN NEW; END IF;

  SELECT * INTO v_shift FROM shifts WHERE id = NEW.shift_id;

  -- Notify all volunteers who have notification_announcements on and are not the requester
  -- (In production, you'd filter to eligible role-matching volunteers)
  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT
    p.id,
    'swap_open',
    jsonb_build_object(
      'swap_id', NEW.id,
      'requester_id', NEW.requester_id,
      'shift_id', NEW.shift_id,
      'date', v_shift.date,
      'shift_type', v_shift.type,
      'event_title', v_shift.event_title,
      'reason', NEW.reason
    )
  FROM profiles p
  WHERE p.notification_announcements = true
    AND p.id != NEW.requester_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_swap_open
  AFTER INSERT ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_swap_open();

-- =====================
-- TRIGGER: notify requester when swap is matched
-- =====================
CREATE OR REPLACE FUNCTION notify_on_swap_matched()
RETURNS TRIGGER AS $$
DECLARE
  v_shift  shifts%ROWTYPE;
BEGIN
  IF NEW.status != 'matched' OR OLD.status = 'matched' THEN RETURN NEW; END IF;

  SELECT * INTO v_shift FROM shifts WHERE id = NEW.shift_id;

  INSERT INTO notification_queue (user_id, notification_type, payload)
  VALUES (
    NEW.requester_id,
    'swap_matched',
    jsonb_build_object(
      'swap_id', NEW.id,
      'responder_id', NEW.responder_id,
      'date', v_shift.date,
      'shift_type', v_shift.type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_swap_matched
  AFTER UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_swap_matched();
