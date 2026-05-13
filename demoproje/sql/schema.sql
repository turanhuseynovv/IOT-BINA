-- ============================================
-- IoT Akıllı Bina Takip Sistemi
-- Database Schema
-- ============================================

-- ── visitors ──
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  visit_count INT DEFAULT 1,
  is_suspicious BOOLEAN DEFAULT FALSE,
  photo_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen_at DESC);

-- ── camera_events ──
CREATE TABLE IF NOT EXISTS camera_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_type TEXT NOT NULL, -- 'inner' or 'outer'
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_camera_events_captured ON camera_events(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(camera_type);

-- ── sensor_readings ──
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  esp_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  is_anomaly BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_esp ON sensor_readings(esp_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON sensor_readings(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded ON sensor_readings(recorded_at DESC);

-- ── security_alerts ──
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

-- ── system_health ──
CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT NOT NULL UNIQUE,
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  error_count INT DEFAULT 0
);

-- ── Row Level Security ──
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY IF NOT EXISTS "Authenticated read visitors" ON visitors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated read camera_events" ON camera_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated read sensor_readings" ON sensor_readings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated read security_alerts" ON security_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated read system_health" ON system_health
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY IF NOT EXISTS "Authenticated manage visitors" ON visitors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated manage camera_events" ON camera_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated insert sensor_readings" ON sensor_readings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated insert security_alerts" ON security_alerts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated manage system_health" ON system_health
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Realtime ──
-- Enable realtime on tables (run these individually if needed)
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE camera_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE security_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE system_health;
