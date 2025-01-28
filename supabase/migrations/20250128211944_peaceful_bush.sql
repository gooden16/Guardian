@@ .. @@
   preferred_days text[],
   quarterly_commitment_count integer DEFAULT 0,
   last_shift_date timestamptz,
+  is_admin boolean DEFAULT false,
   auth_user_id uuid UNIQUE REFERENCES auth.users(id)
 );