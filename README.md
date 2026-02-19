# 🐦 Chirp — Twitter Clone

A full-featured Twitter clone built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## ✨ Features

- 🔐 **Authentication** — Sign up, sign in, sign out (Supabase Auth)
- 🏠 **Home Feed** — Tweets from people you follow
- 📝 **Tweet** — Post tweets with text and images
- ❤️ **Like / Retweet / Bookmark** — Interact with tweets
- 💬 **Replies** — Reply to any tweet
- 🔔 **Notifications** — Likes, follows, replies
- 🔍 **Explore** — Search tweets and people
- 👤 **Profiles** — Follow/unfollow, view profile stats
- 🌙 **Dark / Light Mode** — Toggle with persistence
- 📱 **Responsive** — Mobile bottom bar, tablet, desktop

---

## 🚀 Getting Started

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com) and click **Start for Free**
2. Sign up with GitHub or email
3. Click **New project**
4. Choose a name (e.g., `chirp-clone`), set a database password, pick a region
5. Wait ~2 minutes for the project to be ready

### 2. Set Up the Database

1. In your Supabase dashboard → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this project
3. Copy ALL contents → paste into SQL editor → click **Run**

### 3. Get Your API Keys

1. Supabase dashboard → **Settings → API**
2. Copy **Project URL** and **anon / public key**

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ `.env.local` is already in `.gitignore` — never commit it.

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
twitter-clone/
├── app/
│   ├── (auth)/login        # Login page
│   ├── (auth)/register     # Registration page
│   └── (main)/
│       ├── home/           # Home feed
│       ├── explore/        # Search & trending
│       ├── notifications/  # Notifications
│       ├── bookmarks/      # Saved tweets
│       └── [username]/     # User profile & tweet detail
├── components/
│   ├── auth/               # AuthProvider context
│   ├── layout/             # Sidebar, RightPanel, ThemeProvider
│   ├── tweet/              # TweetCard, TweetComposer
│   └── ui/                 # Avatar, shared UI
├── lib/supabase/           # Supabase client helpers
├── types/                  # TypeScript interfaces
└── supabase/schema.sql     # Full database schema + RLS
```

---

## 📤 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Chirp Twitter Clone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chirp-clone.git
git push -u origin main
```

---

## 🌐 Deploy to Vercel (Free)

1. Push to GitHub (above)
2. Go to https://vercel.com → **New Project** → Import your repository
3. In the Vercel project settings → **Environment Variables** add the following for both Preview and Production:
	- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon/public key
	- `DEMO_MODE` = `false` (disable demo-mode in production)
4. Click **Deploy** — Vercel will build the Next.js app automatically.

Notes:
- Do NOT add the Supabase `service_role` key to client environment variables; keep it secret.
- Once deployed, set the same env vars in Vercel for Production and Preview to match your Supabase project.

---

## 🛠 Tech Stack

| Technology      | Purpose                      |
| --------------- | ---------------------------- |
| Next.js 14      | React framework (App Router) |
| TypeScript      | Type safety                  |
| Tailwind CSS    | Styling                      |
| Supabase        | Database, Auth, Storage      |
| lucide-react    | Icons                        |
| react-hot-toast | Toast notifications          |
| timeago.js      | Relative timestamps          |

---

MIT License
