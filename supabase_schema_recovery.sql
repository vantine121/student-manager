-- BẢNG LỚP HỌC (CLASSES)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- BẢNG NGƯỜI DÙNG (PROFILES)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'STUDENT',
  class_name TEXT,
  group_number INTEGER DEFAULT 0,
  is_group_locked BOOLEAN DEFAULT false,
  current_points INTEGER DEFAULT 0,
  wallet_coins INTEGER DEFAULT 0,
  avatar_code TEXT,
  owned_frames JSONB DEFAULT '[]'::jsonb,
  unlocked_badges JSONB DEFAULT '[]'::jsonb
);

-- BẢNG LỊCH SỬ ĐIỂM (POINT LOGS)
CREATE TABLE IF NOT EXISTS point_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- BẢNG PHẦN THƯỞNG (REWARDS)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT
);

-- BẢNG ĐỔI THƯỞNG (REDEMPTIONS)
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- BẢNG LUẬT (RULES)
CREATE TABLE IF NOT EXISTS rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN DEFAULT true,
  type TEXT NOT NULL
);

-- HÀM VÀ TRIGGER: TỰ ĐỘNG TẠO PROFILE KHI CÓ USER ĐĂNG KÝ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'STUDENT');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TẠO NƠI LƯU TRỮ ẢNH (STORAGE BUCKET)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reward-images', 'reward-images', true) 
ON CONFLICT (id) DO NOTHING;

-- TẮT BẢO MẬT RLS (ĐỂ APP CHẠY ĐƯỢC LUÔN DO LÀ APP NỘI BỘ)
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rules DISABLE ROW LEVEL SECURITY;

