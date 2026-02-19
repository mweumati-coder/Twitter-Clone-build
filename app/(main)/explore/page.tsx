'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import TweetCard from '@/components/tweet/TweetCard';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import type { Tweet, Profile } from '@/types';
import { Search } from 'lucide-react';
import styles from './explore.module.css';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [trending, setTrending] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  // Load trending (most liked recent tweets)
  useEffect(() => {
    const loadTrending = async () => {
      const { data } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!data) return;
      const tweetIds = data.map(t => t.id);
      const statsRes = await supabase.from('tweet_stats').select('*').in('tweet_id', tweetIds);
      const statsMap: Record<string, {like_count: number; retweet_count: number; bookmark_count: number; reply_count: number}> = {};
      statsRes.data?.forEach(s => { statsMap[s.tweet_id] = s; });

      const enriched = data.map(t => ({
        ...t,
        like_count: statsMap[t.id]?.like_count ?? 0,
        retweet_count: statsMap[t.id]?.retweet_count ?? 0,
        bookmark_count: statsMap[t.id]?.bookmark_count ?? 0,
        reply_count: statsMap[t.id]?.reply_count ?? 0,
        is_liked: false, is_retweeted: false, is_bookmarked: false,
      })) as Tweet[];

      setTrending(enriched.sort((a, b) => b.like_count - a.like_count).slice(0, 5));
    };
    loadTrending();
  }, [supabase]);

  useEffect(() => {
    if (!query.trim()) { setTweets([]); setUsers([]); setSearched(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const [usersRes, tweetsRes] = await Promise.all([
        supabase.from('profiles').select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(5),
        supabase.from('tweets').select('*, profile:profiles(*)')
          .ilike('content', `%${query}%`).order('created_at', { ascending: false }).limit(20),
      ]);

      setUsers((usersRes.data as Profile[]) ?? []);

      const tweetData = tweetsRes.data ?? [];
      const tweetIds = tweetData.map(t => t.id);

      let likedIds = new Set<string>();
      if (user && tweetIds.length) {
        const { data: likes } = await supabase.from('likes').select('tweet_id').eq('user_id', user.id).in('tweet_id', tweetIds);
        likedIds = new Set(likes?.map(l => l.tweet_id));
      }

      const { data: stats } = await supabase.from('tweet_stats').select('*').in('tweet_id', tweetIds);
      const statsMap: Record<string, {like_count: number; retweet_count: number; bookmark_count: number; reply_count: number}> = {};
      stats?.forEach(s => { statsMap[s.tweet_id] = s; });

      setTweets(tweetData.map(t => ({
        ...t,
        like_count: statsMap[t.id]?.like_count ?? 0,
        retweet_count: statsMap[t.id]?.retweet_count ?? 0,
        bookmark_count: statsMap[t.id]?.bookmark_count ?? 0,
        reply_count: statsMap[t.id]?.reply_count ?? 0,
        is_liked: likedIds.has(t.id),
        is_retweeted: false, is_bookmarked: false,
      })) as Tweet[]);

      setSearched(true);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, user, supabase]);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Explore</h1>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tweets and people"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </header>

      {loading && (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      )}

      {!loading && searched && (
        <>
          {users.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>People</h2>
              {users.map(p => (
                <Link key={p.id} href={`/${p.username}`} className={styles.userResult}>
                  <Avatar src={p.avatar_url} name={p.display_name} size={46} />
                  <div>
                    <div className={styles.userName}>{p.display_name}</div>
                    <div className={styles.userHandle}>@{p.username}</div>
                    {p.bio && <div className={styles.userBio}>{p.bio}</div>}
                  </div>
                </Link>
              ))}
            </section>
          )}

          <h2 className={styles.sectionTitle}>Tweets</h2>
          {tweets.length === 0 ? (
            <div className={styles.empty}>
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : tweets.map(t => (
            <TweetCard key={t.id} tweet={t} />
          ))}
        </>
      )}

      {!searched && !loading && (
        <>
          <h2 className={styles.sectionTitle}>Trending</h2>
          {trending.map(t => <TweetCard key={t.id} tweet={t} />)}
        </>
      )}
    </div>
  );
}
