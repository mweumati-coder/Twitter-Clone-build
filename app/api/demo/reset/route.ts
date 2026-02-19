import { NextResponse } from 'next/server';

const defaultStore = {
  profiles: [
    { id: 'demo_user_1', username: 'demo_user', name: 'Demo User', avatar_url: null },
  ],
  tweets: [
    {
      id: 't1',
      profile_id: 'demo_user_1',
      text: 'Welcome to Chirp — this is a demo tweet!',
      created_at: new Date().toISOString(),
      reply_to_id: null,
    },
  ],
  likes: [],
  retweets: [],
  bookmarks: [],
  tweet_stats: [],
};

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Demo mode disabled' }, { status: 403 });
  }

  try {
    // write defaultStore to .demo_data.json in project root
    const fs = await import('fs');
    const path = await import('path');
    const file = path.resolve(process.cwd(), '.demo_data.json');
    fs.writeFileSync(file, JSON.stringify(defaultStore, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
}
