CREATE TABLE support_tickets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text NOT NULL,
  email      text NOT NULL,
  subject    text NOT NULL,
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX ON support_tickets(status);
CREATE INDEX ON support_tickets(created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a ticket
CREATE POLICY "support_tickets_insert" ON support_tickets
  FOR INSERT WITH CHECK (true);

-- Users can read their own tickets
CREATE POLICY "support_tickets_own_read" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read and update all tickets (via admin client / service role)
