/*
  Guardian — Complete Fresh Schema
  Run this on a blank Supabase project.
  Drops old tables first, then creates everything clean.
*/

-- =====================
-- DROP OLD TABLES (cascade removes dependent objects)
-- =====================
DROP TABLE IF EXISTS swap_requests         CASCADE;
DROP TABLE IF EXISTS notification_queue    CASCADE;
DROP TABLE IF EXISTS scheduler_runs        CASCADE;
DROP TABLE IF EXISTS announcements         CASCADE;
DROP TABLE IF EXISTS shift_assignments     CASCADE;
DROP TABLE IF EXISTS shift_volunteers      CASCADE;  -- old name
DROP TABLE IF EXISTS shifts                CASCADE;
DROP TABLE IF EXISTS role_change_requests  CASCADE;
DROP TABLE IF EXISTS audit_logs            CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;
DROP TABLE IF EXISTS quarters              CASCADE;
DROP TABLE IF EXISTS roles                 CASCADE;

DROP FUNCTION IF EXISTS is_admin(UUID)              CASCADE;
DROP FUNCTION IF EXISTS handle_profile_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_shift_updated_at()   CASCADE;
DROP FUNCTION IF EXISTS notify_on_announcement()    CASCADE;
DROP FUNCTION IF EXISTS notify_on_assignment()      CASCADE;
DROP FUNCTION IF EXISTS notify_on_swap_open()       CASCADE;
DROP FUNCTION IF EXISTS notify_on_swap_matched()    CASCADE;
DROP FUNCTION IF EXISTS confirm_swap(UUID)           CASCADE;

DROP TYPE IF EXISTS volunteer_role    CASCADE;
DROP TYPE IF EXISTS shift_type        CASCADE;
DROP TYPE IF EXISTS role_change_status CASCADE;

-- =====================
-- ENUMS
-- =====================
DO $$ BEGIN
  CREATE TYPE volunteer_role AS ENUM ('TL', 'L2', 'L1');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('early', 'late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- ROLES LOOKUP TABLE
-- =====================
CREATE TABLE IF NOT EXISTS roles (
  role                volunteer_role PRIMARY KEY,
  description         TEXT NOT NULL,
  quarterly_commitment INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (role, description, quarterly_commitment) VALUES
  ('TL', 'Team Leader', 4),
  ('L2', 'Level 2 Volunteer', 3),
  ('L1', 'Level 1 Volunteer', 3)
ON CONFLICT DO NOTHING;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT TO authenticated USING (true);

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id                           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                        TEXT NOT NULL UNIQUE,
  first_name                   TEXT NOT NULL,
  last_name                    TEXT NOT NULL,
  phone                        TEXT,
  role                         volunteer_role NOT NULL REFERENCES roles(role) DEFAULT 'L1',
  is_admin                     BOOLEAN NOT NULL DEFAULT false,
  preferred_shift              TEXT,                        -- 'early' | 'late' | null
  avatar_url                   TEXT,
  -- New preference columns
  blackout_dates               DATE[]  DEFAULT '{}',
  partner_preferences          UUID[]  DEFAULT '{}',
  notification_assignments     BOOLEAN NOT NULL DEFAULT true,
  notification_changes         BOOLEAN NOT NULL DEFAULT true,
  notification_announcements   BOOLEAN NOT NULL DEFAULT true,
  onboarding_complete          BOOLEAN NOT NULL DEFAULT false,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function (avoids recursive policy lookups)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_admin = true);
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Allow profile insert" ON profiles;
CREATE POLICY "Allow profile insert"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id AND (
      NOT EXISTS (SELECT 1 FROM profiles) OR is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow viewing own profile" ON profiles;
CREATE POLICY "Allow viewing own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow updating own profile" ON profiles;
CREATE POLICY "Allow updating own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND is_admin = false);

DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
CREATE POLICY "Allow admin full access"
  ON profiles FOR ALL
  USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_profile_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================
-- QUARTERS
-- =====================
CREATE TABLE IF NOT EXISTS quarters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  start_date          DATE NOT NULL UNIQUE,
  end_date            DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'setup'
                        CHECK (status IN ('setup','preferences','scheduled','active','closed')),
  swap_deadline_hours INTEGER NOT NULL DEFAULT 48,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view quarters" ON quarters;
CREATE POLICY "Authenticated users can view quarters"
  ON quarters FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage quarters" ON quarters;
CREATE POLICY "Admins can manage quarters"
  ON quarters FOR ALL
  USING (is_admin(auth.uid()));

-- =====================
-- SHIFTS
-- =====================
CREATE TABLE IF NOT EXISTS shifts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  type             shift_type NOT NULL,
  hebrew_parasha   TEXT,
  quarter_id       UUID REFERENCES quarters(id),
  event_type       TEXT DEFAULT 'shabbat'
                     CHECK (event_type IN ('shabbat','holiday','evening')),
  event_title      TEXT,
  event_notes      TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','published')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, type)
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;
CREATE POLICY "Anyone can view shifts"
  ON shifts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify shifts" ON shifts;
CREATE POLICY "Only admins can modify shifts"
  ON shifts FOR ALL USING (is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION handle_shift_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION handle_shift_updated_at();

CREATE INDEX IF NOT EXISTS idx_shifts_date       ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_quarter_id ON shifts(quarter_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status     ON shifts(status);

-- =====================
-- SHIFT ASSIGNMENTS  (replaces old shift_volunteers)
-- =====================
CREATE TABLE IF NOT EXISTS shift_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id          UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_source TEXT NOT NULL DEFAULT 'self'
                      CHECK (assignment_source IN ('auto','manual','self')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, user_id)
);

ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all assignments" ON shift_assignments;
CREATE POLICY "Users can view all assignments"
  ON shift_assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can sign themselves up" ON shift_assignments;
CREATE POLICY "Users can sign themselves up"
  ON shift_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove themselves" ON shift_assignments;
CREATE POLICY "Users can remove themselves"
  ON shift_assignments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all assignments" ON shift_assignments;
CREATE POLICY "Admins can manage all assignments"
  ON shift_assignments FOR ALL USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_user_id  ON shift_assignments(user_id);

-- =====================
-- ANNOUNCEMENTS
-- =====================
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id   UUID REFERENCES shifts(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view announcements" ON announcements;
CREATE POLICY "Authenticated users can view announcements"
  ON announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and TLs can post announcements" ON announcements;
CREATE POLICY "Admins and TLs can post announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND (
      is_admin(auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'TL')
    )
  );

DROP POLICY IF EXISTS "Authors can delete their own announcements" ON announcements;
CREATE POLICY "Authors can delete their own announcements"
  ON announcements FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_announcements_shift   ON announcements(shift_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- =====================
-- SCHEDULER RUNS
-- =====================
CREATE TABLE IF NOT EXISTS scheduler_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter_id     UUID NOT NULL REFERENCES quarters(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','completed','failed')),
  result_summary JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

ALTER TABLE scheduler_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage scheduler runs" ON scheduler_runs;
CREATE POLICY "Admins can manage scheduler runs"
  ON scheduler_runs FOR ALL USING (is_admin(auth.uid()));

-- =====================
-- NOTIFICATION QUEUE
-- =====================
CREATE TABLE IF NOT EXISTS notification_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
                      CHECK (notification_type IN (
                        'assignment','change','announcement',
                        'swap_open','swap_matched','swap_confirmed','swap_expired'
                      )),
  payload           JSONB NOT NULL DEFAULT '{}',
  sent_at           TIMESTAMPTZ,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notification queue" ON notification_queue;
CREATE POLICY "Admins can view notification queue"
  ON notification_queue FOR SELECT USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_notif_queue_sent ON notification_queue(sent_at) WHERE sent_at IS NULL;

-- =====================
-- SWAP REQUESTS
-- =====================
CREATE TABLE IF NOT EXISTS swap_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id         UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  offered_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','matched','confirmed','cancelled','expired')),
  responder_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view swap requests" ON swap_requests;
CREATE POLICY "Authenticated users can view swap requests"
  ON swap_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Volunteers can create swap requests" ON swap_requests;
CREATE POLICY "Volunteers can create swap requests"
  ON swap_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (
      SELECT 1 FROM shift_assignments
      WHERE user_id = auth.uid() AND shift_id = swap_requests.shift_id
    )
  );

DROP POLICY IF EXISTS "Requester or responder can update swap request" ON swap_requests;
CREATE POLICY "Requester or responder can update swap request"
  ON swap_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = responder_id);

DROP POLICY IF EXISTS "Admins can manage all swap requests" ON swap_requests;
CREATE POLICY "Admins can manage all swap requests"
  ON swap_requests FOR ALL USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_swap_requests_shift  ON swap_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);

-- =====================
-- TRIGGER: notify on announcement
-- =====================
CREATE OR REPLACE FUNCTION notify_on_announcement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT p.id, 'announcement',
    jsonb_build_object(
      'announcement_id', NEW.id,
      'author_id', NEW.author_id,
      'body', LEFT(NEW.body, 200),
      'shift_id', NEW.shift_id
    )
  FROM profiles p
  WHERE p.notification_announcements = true AND p.id != NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_announcement ON announcements;
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
    SELECT NEW.user_id, 'assignment',
      jsonb_build_object('shift_id', NEW.shift_id, 'assignment_source', NEW.assignment_source)
    FROM profiles p WHERE p.id = NEW.user_id AND p.notification_assignments = true;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notification_queue (user_id, notification_type, payload)
    SELECT OLD.user_id, 'change',
      jsonb_build_object('shift_id', OLD.shift_id, 'change_type', 'removed')
    FROM profiles p WHERE p.id = OLD.user_id AND p.notification_changes = true;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_assignment ON shift_assignments;
CREATE TRIGGER trigger_notify_assignment
  AFTER INSERT OR DELETE ON shift_assignments
  FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

-- =====================
-- TRIGGER: notify on swap open
-- =====================
CREATE OR REPLACE FUNCTION notify_on_swap_open()
RETURNS TRIGGER AS $$
DECLARE v_shift shifts%ROWTYPE;
BEGIN
  IF NEW.status != 'open' THEN RETURN NEW; END IF;
  SELECT * INTO v_shift FROM shifts WHERE id = NEW.shift_id;
  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT p.id, 'swap_open',
    jsonb_build_object(
      'swap_id', NEW.id, 'requester_id', NEW.requester_id,
      'shift_id', NEW.shift_id, 'date', v_shift.date,
      'shift_type', v_shift.type, 'event_title', v_shift.event_title,
      'reason', NEW.reason
    )
  FROM profiles p
  WHERE p.notification_announcements = true AND p.id != NEW.requester_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_swap_open ON swap_requests;
CREATE TRIGGER trigger_notify_swap_open
  AFTER INSERT ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_swap_open();

-- =====================
-- TRIGGER: notify on swap matched
-- =====================
CREATE OR REPLACE FUNCTION notify_on_swap_matched()
RETURNS TRIGGER AS $$
DECLARE v_shift shifts%ROWTYPE;
BEGIN
  IF NEW.status != 'matched' OR OLD.status = 'matched' THEN RETURN NEW; END IF;
  SELECT * INTO v_shift FROM shifts WHERE id = NEW.shift_id;
  INSERT INTO notification_queue (user_id, notification_type, payload)
  VALUES (NEW.requester_id, 'swap_matched',
    jsonb_build_object(
      'swap_id', NEW.id, 'responder_id', NEW.responder_id,
      'date', v_shift.date, 'shift_type', v_shift.type
    ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_swap_matched ON swap_requests;
CREATE TRIGGER trigger_notify_swap_matched
  AFTER UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_swap_matched();

-- =====================
-- FUNCTION: confirm_swap (atomic swap execution)
-- =====================
CREATE OR REPLACE FUNCTION confirm_swap(p_swap_id UUID)
RETURNS void AS $$
DECLARE
  v_swap swap_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_swap FROM swap_requests WHERE id = p_swap_id FOR UPDATE;

  IF v_swap.status NOT IN ('open', 'matched') THEN
    RAISE EXCEPTION 'Swap % is not in a confirmable state (status: %)', p_swap_id, v_swap.status;
  END IF;

  IF v_swap.responder_id IS NULL THEN
    RAISE EXCEPTION 'Swap % has no responder yet', p_swap_id;
  END IF;

  -- Move requester out, responder in
  DELETE FROM shift_assignments WHERE shift_id = v_swap.shift_id AND user_id = v_swap.requester_id;
  INSERT INTO shift_assignments (shift_id, user_id, assignment_source)
  VALUES (v_swap.shift_id, v_swap.responder_id, 'manual')
  ON CONFLICT (shift_id, user_id) DO NOTHING;

  -- Reciprocal swap if an offered shift exists
  IF v_swap.offered_shift_id IS NOT NULL THEN
    DELETE FROM shift_assignments WHERE shift_id = v_swap.offered_shift_id AND user_id = v_swap.responder_id;
    INSERT INTO shift_assignments (shift_id, user_id, assignment_source)
    VALUES (v_swap.offered_shift_id, v_swap.requester_id, 'manual')
    ON CONFLICT (shift_id, user_id) DO NOTHING;
  END IF;

  UPDATE swap_requests SET status = 'confirmed' WHERE id = p_swap_id;

  INSERT INTO notification_queue (user_id, notification_type, payload)
  SELECT unnest(ARRAY[v_swap.requester_id, v_swap.responder_id]),
         'swap_confirmed',
         jsonb_build_object('swap_id', p_swap_id, 'shift_id', v_swap.shift_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
