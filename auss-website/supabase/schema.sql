-- ============================================================
-- USSAU Website Database Schema
-- United Scholars' Society of Adamson University
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id)
);

-- ============================================================
-- ORGANIZATION INFORMATION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_information (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'United Scholars'' Society of Adamson University',
  tagline TEXT,
  description TEXT,
  mission TEXT,
  vision TEXT,
  history TEXT,
  goals TEXT,
  objectives TEXT,
  core_values TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  office_hours TEXT,
  map_embed_url TEXT,
  established_year INT DEFAULT 2010,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT,
  date DATE NOT NULL,
  time TEXT,
  end_date DATE,
  venue TEXT NOT NULL,
  organizer TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  registration_link TEXT,
  registration_deadline DATE,
  registration_status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (registration_status IN ('open', 'closed', 'coming_soon')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENT GALLERY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OFFICER CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OFFICERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  course TEXT,
  year_level TEXT,
  avatar_url TEXT,
  email TEXT,
  bio TEXT,
  "order" INT DEFAULT 0,
  hierarchy_row INT NOT NULL DEFAULT 1,
  category_id UUID REFERENCES officer_categories(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Academic',
  awarded_by TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FEEDBACK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  course TEXT,
  year_level TEXT,
  student_number TEXT,
  category TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INQUIRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOCIAL MEDIA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS social_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id),
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEBSITE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  label TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GALLERY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (no auth required)
CREATE POLICY "Public read organization_information" ON organization_information FOR SELECT TO anon USING (true);
CREATE POLICY "Public read announcements" ON announcements FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Public read events" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "Public read event_gallery" ON event_gallery FOR SELECT TO anon USING (true);
CREATE POLICY "Public read officers" ON officers FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read officer_categories" ON officer_categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT TO anon USING (true);
CREATE POLICY "Public read social_media" ON social_media FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read gallery" ON gallery FOR SELECT TO anon USING (true);

-- PUBLIC INSERT policies (feedback and inquiries)
CREATE POLICY "Public insert feedback" ON feedback FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert inquiries" ON inquiries FOR INSERT TO anon WITH CHECK (true);

-- AUTHENTICATED (ADMIN) FULL ACCESS policies
CREATE POLICY "Admin full access admins" ON admins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access organization_information" ON organization_information FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access announcements" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access event_gallery" ON event_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access officers" ON officers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access officer_categories" ON officer_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access achievements" ON achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access feedback" ON feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access inquiries" ON inquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access social_media" ON social_media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access activity_logs" ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access website_settings" ON website_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access gallery" ON gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_information_updated_at BEFORE UPDATE ON organization_information FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_officer_categories_updated_at BEFORE UPDATE ON officer_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard or CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('announcements', 'announcements', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('officers', 'officers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('achievements', 'achievements', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- ============================================================
-- SAMPLE DATA (Optional)
-- ============================================================
INSERT INTO organization_information (name, tagline, description, email, phone, address, office_hours, established_year)
VALUES (
  'United Scholars'' Society of Adamson University',
  'Empowering Scholars, Building Leaders',
  'The United Scholars'' Society of Adamson University (USSAU) is the official academic organization for scholarship recipients at Adamson University.',
  'asaadu@adamson.edu.ph',
  '+63 (2) 8524-2011',
  '900 San Marcelino St., Ermita, Manila, Philippines 1000',
  'Monday to Friday, 8:00 AM - 5:00 PM',
  2010
);

INSERT INTO social_media (platform, url, icon, is_active, "order") VALUES
  ('Facebook', 'https://facebook.com', 'facebook', true, 1),
  ('Instagram', 'https://instagram.com', 'instagram', true, 2),
  ('Twitter', 'https://twitter.com', 'twitter', true, 3),
  ('YouTube', 'https://youtube.com', 'youtube', true, 4);
