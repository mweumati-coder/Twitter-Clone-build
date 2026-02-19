'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import TweetCard from '@/components/tweet/TweetCard';
import TweetComposer from '@/components/tweet/TweetComposer';
import type { Tweet } from '@/types';
import styles from './home.module.css';

async function fetchTweets(supabase: ReturnType<typeof createClient>, userId: string): Promise<Tweet[]> {
  // Get IDs of people the user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = follows?.map(f => f.following_id) ?? [];
  const feedIds = [...followingIds, userId];

  const { data: tweets } = await supabase
    .from('tweets')
    .select('*, profile:profiles(*)')
    .in('user_id', feedIds)
    .is('reply_to_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!tweets) return [];

  // Fetch stats and user interactions in parallel
  const tweetIds = tweets.map(t => t.id);

  const [likesRes, retweetsRes, bookmarksRes, repliesRes, statsRes] = await Promise.all([
    supabase.from('likes').select('tweet_id').eq('user_id', userId).in('tweet_id', tweetIds),
    supabase.from('retweets').select('tweet_id').eq('user_id', userId).in('tweet_id', tweetIds),
    supabase.from('bookmarks').select('tweet_id').eq('user_id', userId).in('tweet_id', tweetIds),
    supabase.from('tweets').select('reply_to_id').in('reply_to_id', tweetIds),
    supabase.from('tweet_stats').select('*').in('tweet_id', tweetIds),
  ]);

  const likedIds = new Set(likesRes.data?.map(l => l.tweet_id));
  const retweetedIds = new Set(retweetsRes.data?.map(r => r.tweet_id));
  const bookmarkedIds = new Set(bookmarksRes.data?.map(b => b.tweet_id));
  const replyCounts: Record<string, number> = {};
  repliesRes.data?.forEach(r => {
    replyCounts[r.reply_to_id] = (replyCounts[r.reply_to_id] ?? 0) + 1;
  });
  const statsMap: Record<string, { like_count: number; retweet_count: number; bookmark_count: number }> = {};
  statsRes.data?.forEach(s => { statsMap[s.tweet_id] = s; });

  return tweets.map(t => ({
    ...t,
    like_count: statsMap[t.id]?.like_count ?? 0,
    retweet_count: statsMap[t.id]?.retweet_count ?? 0,
    bookmark_count: statsMap[t.id]?.bookmark_count ?? 0,
    reply_count: replyCounts[t.id] ?? 0,
    is_liked: likedIds.has(t.id),
    is_retweeted: retweetedIds.has(t.id),
    is_bookmarked: bookmarkedIds.has(t.id),
  })) as Tweet[];
}

export default function HomePage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const loadTweets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchTweets(supabase, user.id);
    setTweets(data);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { loadTweets(); }, [loadTweets]);

  const handleTweetPosted = (tweet: Tweet) => {
    setTweets(prev => [tweet, ...prev]);
  };

  const handleDelete = (id: string) => {
    setTweets(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Home</h1>
      </header>

      <TweetComposer onTweetPosted={handleTweetPosted} />

      <div className={styles.feed}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : tweets.length === 0 ? (
          <div className={styles.empty}>
            <h3>Nothing here yet</h3>
            <p>Follow some people or post your first tweet!</p>
          </div>
        ) : (
          tweets.map(tweet => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
