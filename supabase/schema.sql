-- ============================================================
-- Twitter Clone — Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- PROFILES  (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  bio          TEXT DEFAULT '',
  avatar_url   TEXT DEFAULT '',
  banner_url   TEXT DEFAULT '',
  website      TEXT DEFAULT '',
  location     TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- TWEETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tweets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) <= 280),
  image_url       TEXT DEFAULT '',
  reply_to_id     UUID REFERENCES public.tweets(id) ON DELETE SET NULL,
  retweet_of_id   UUID REFERENCES public.tweets(id) ON DELETE SET NULL,
  quote_content   TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tweets are viewable by everyone"
  ON public.tweets FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tweets"
  ON public.tweets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tweets"
  ON public.tweets FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- LIKES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tweet_id   UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can like tweets"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tweets"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- RETWEETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retweets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tweet_id   UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);

ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retweets are viewable by everyone"
  ON public.retweets FOR SELECT USING (true);

CREATE POLICY "Users can retweet"
  ON public.retweets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undo retweet"
  ON public.retweets FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────
-- BOOKMARKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tweet_id   UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete bookmarks"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('like','retweet','follow','mention','reply')),
  tweet_id    UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('tweet-images', 'tweet-images', true)
  ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('banners', 'banners', true)
  ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view tweet images"
  ON storage.objects FOR SELECT USING (bucket_id = 'tweet-images');

CREATE POLICY "Authenticated users can upload tweet images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'tweet-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view banners"
  ON storage.objects FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'banners' AND auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-create notifications for likes
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
  tweet_owner_id UUID;
BEGIN
  SELECT user_id INTO tweet_owner_id FROM public.tweets WHERE id = NEW.tweet_id;
  IF tweet_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, tweet_id)
    VALUES (tweet_owner_id, NEW.user_id, 'like', NEW.tweet_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-create notifications for follows
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

-- ─────────────────────────────────────────────────────────────
-- HELPER VIEWS (for tweet counts)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.tweet_stats AS
SELECT
  t.id AS tweet_id,
  COUNT(DISTINCT l.id) AS like_count,
  COUNT(DISTINCT r.id) AS retweet_count,
  COUNT(DISTINCT b.id) AS bookmark_count,
  COUNT(DISTINCT rep.id) AS reply_count
FROM public.tweets t
LEFT JOIN public.likes l ON l.tweet_id = t.id
LEFT JOIN public.retweets r ON r.tweet_id = t.id
LEFT JOIN public.bookmarks b ON b.tweet_id = t.id
LEFT JOIN public.tweets rep ON rep.reply_to_id = t.id
GROUP BY t.id;
