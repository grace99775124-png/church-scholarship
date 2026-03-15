-- =========================================
-- 교회 장학금 신청 시스템 - Supabase 스키마
-- =========================================

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 장학 프로그램 테이블
CREATE TABLE IF NOT EXISTS scholarships (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 장학금 신청 테이블
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  school TEXT NOT NULL,
  school_level TEXT NOT NULL,
  grade TEXT NOT NULL,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  contact TEXT NOT NULL,
  scholarship_id BIGINT REFERENCES scholarships(id),
  reason TEXT NOT NULL,
  recommender_name TEXT,
  recommender_title TEXT,
  recommender_phone TEXT,
  recommender_comment TEXT,
  status TEXT DEFAULT 'pending',
  status_note TEXT,
  paid_amount INTEGER,
  paid_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (서버에서만 접근, 직접 보안 처리)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
