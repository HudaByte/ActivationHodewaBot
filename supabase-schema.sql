-- ============================================
-- ACTIVATION SYSTEM DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tabel activation codes
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) UNIQUE NOT NULL,
  max_devices INT DEFAULT 1,
  duration_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  note TEXT
);

-- Tabel device sessions
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code_id UUID REFERENCES activation_codes(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB,
  UNIQUE(activation_code_id, device_id)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_expires ON device_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_active ON activation_codes(is_active);

-- ============================================
-- OPTIONAL: Enable Row Level Security (RLS)
-- Uncomment jika ingin menggunakan RLS
-- ============================================

-- ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Service role has full access to activation_codes" 
--   ON activation_codes FOR ALL 
--   USING (true);

-- CREATE POLICY "Service role has full access to device_sessions" 
--   ON device_sessions FOR ALL 
--   USING (true);
