-- Enable RLS (already on by default, idempotent)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_notes ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (internal tool — auth to be added later)
CREATE POLICY "anon_all_clients" ON clients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sessions" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_session_inputs" ON session_inputs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_session_outputs" ON session_outputs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_consultant_notes" ON consultant_notes FOR ALL TO anon USING (true) WITH CHECK (true);
