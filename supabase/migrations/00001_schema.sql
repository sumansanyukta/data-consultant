-- Clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  analysis_type TEXT[] DEFAULT '{}',
  consultant TEXT,
  confidence INTEGER DEFAULT 0,
  date TEXT,
  goal TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session Inputs
CREATE TABLE session_inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  brief_text TEXT DEFAULT '',
  business_goal TEXT DEFAULT '',
  constraints TEXT DEFAULT '',
  data_files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session Outputs
CREATE TABLE session_outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  exec_summary TEXT DEFAULT '',
  key_signals JSONB DEFAULT '[]',
  data_quality_flags JSONB DEFAULT '[]',
  recommended_analyses JSONB DEFAULT '[]',
  follow_up_questions JSONB DEFAULT '[]',
  assumptions JSONB DEFAULT '[]',
  confidence_score INTEGER DEFAULT 0,
  data_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consultant Notes
CREATE TABLE consultant_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  note_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_session_inputs_session_id ON session_inputs(session_id);
CREATE INDEX idx_session_outputs_session_id ON session_outputs(session_id);
CREATE INDEX idx_consultant_notes_session_id ON consultant_notes(session_id);
