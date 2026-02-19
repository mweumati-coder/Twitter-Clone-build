'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import TweetCard from '@/components/tweet/TweetCard';
import type { Tweet } from '@/types';
import styles from './bookmarks.module.css';

export default function BookmarksPage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('tweet_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!bookmarks?.length) { setLoading(false); return; }

      const tweetIds = bookmarks.map(b => b.tweet_id);
      const { data: tweetsData } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .in('id', tweetIds);

      if (!tweetsData) { setLoading(false); return; }

      const [likesRes, retweetsRes, statsRes] = await Promise.all([
        supabase.from('likes').select('tweet_id').eq('user_id', user.id).in('tweet_id', tweetIds),
        supabase.from('retweets').select('tweet_id').eq('user_id', user.id).in('tweet_id', tweetIds),
        supabase.from('tweet_stats').select('*').in('tweet_id', tweetIds),
      ]);

      const likedIds = new Set(likesRes.data?.map(l => l.tweet_id));
      const retweetedIds = new Set(retweetsRes.data?.map(r => r.tweet_id));
      const statsMap: Record<string, {like_count: number; retweet_count: number; bookmark_count: number; reply_count: number}> = {};
      statsRes.data?.forEach(s => { statsMap[s.tweet_id] = s; });

      const enriched = tweetsData.map(t => ({
        ...t,
        like_count: statsMap[t.id]?.like_count ?? 0,
        retweet_count: statsMap[t.id]?.retweet_count ?? 0,
        bookmark_count: statsMap[t.id]?.bookmark_count ?? 0,
        reply_count: statsMap[t.id]?.reply_count ?? 0,
        is_liked: likedIds.has(t.id),
        is_retweeted: retweetedIds.has(t.id),
        is_bookmarked: true,
      })) as Tweet[];

      // Sort by bookmark order
      const sortMap: Record<string, number> = {};
      bookmarks.forEach((b, i) => { sortMap[b.tweet_id] = i; });
      enriched.sort((a, b) => (sortMap[a.id] ?? 0) - (sortMap[b.id] ?? 0));

      setTweets(enriched);
      setLoading(false);
    };
    load();
  }, [user, supabase]);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Bookmarks</h1>
      </header>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : tweets.length === 0 ? (
        <div className={styles.empty}>
          <h3>Save tweets for later</h3>
          <p>Don&apos;t let the good ones fly away. Bookmark tweets to easily find them again in the future.</p>
        </div>
      ) : (
        tweets.map(tweet => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            onDelete={id => setTweets(p => p.filter(t => t.id !== id))}
          />
        ))
      )}
    </div>
  );
}
