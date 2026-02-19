'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TweetCard from '@/components/tweet/TweetCard';
import TweetComposer from '@/components/tweet/TweetComposer';
import Avatar from '@/components/ui/Avatar';
import type { Tweet } from '@/types';
import { format } from 'timeago.js';
import styles from './status.module.css';

export default function TweetDetailPage() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const { user } = useAuth();
  const supabase = createClient();
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [replies, setReplies] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: tweetData } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single();
      if (!tweetData) { setLoading(false); return; }

      const [likesRes, retweetsRes, bookmarksRes, statsRes] = await Promise.all([
        user ? supabase.from('likes').select('tweet_id').eq('user_id', user.id).eq('tweet_id', id) : Promise.resolve({ data: [] }),
        user ? supabase.from('retweets').select('tweet_id').eq('user_id', user.id).eq('tweet_id', id) : Promise.resolve({ data: [] }),
        user ? supabase.from('bookmarks').select('tweet_id').eq('user_id', user.id).eq('tweet_id', id) : Promise.resolve({ data: [] }),
        supabase.from('tweet_stats').select('*').eq('tweet_id', id).single(),
      ]);

      const enriched: Tweet = {
        ...tweetData as Tweet,
        like_count: statsRes.data?.like_count ?? 0,
        retweet_count: statsRes.data?.retweet_count ?? 0,
        bookmark_count: statsRes.data?.bookmark_count ?? 0,
        reply_count: statsRes.data?.reply_count ?? 0,
        is_liked: (likesRes.data?.length ?? 0) > 0,
        is_retweeted: (retweetsRes.data?.length ?? 0) > 0,
        is_bookmarked: (bookmarksRes.data?.length ?? 0) > 0,
      };
      setTweet(enriched);

      // Fetch replies
      const { data: replyData } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .eq('reply_to_id', id)
        .order('created_at', { ascending: true });

      if (replyData) {
        const replyIds = replyData.map(r => r.id);
        const [rLikes, rRetweets, rStats] = await Promise.all([
          user ? supabase.from('likes').select('tweet_id').eq('user_id', user.id).in('tweet_id', replyIds) : Promise.resolve({ data: [] }),
          user ? supabase.from('retweets').select('tweet_id').eq('user_id', user.id).in('tweet_id', replyIds) : Promise.resolve({ data: [] }),
          supabase.from('tweet_stats').select('*').in('tweet_id', replyIds),
        ]);
        const likedIds = new Set(rLikes.data?.map(l => l.tweet_id));
        const retweetedIds = new Set(rRetweets.data?.map(r => r.tweet_id));
        const statsMap: Record<string, {like_count: number; retweet_count: number; bookmark_count: number; reply_count: number}> = {};
        rStats.data?.forEach(s => { statsMap[s.tweet_id] = s; });

        setReplies(replyData.map(r => ({
          ...r,
          like_count: statsMap[r.id]?.like_count ?? 0,
          retweet_count: statsMap[r.id]?.retweet_count ?? 0,
          bookmark_count: statsMap[r.id]?.bookmark_count ?? 0,
          reply_count: statsMap[r.id]?.reply_count ?? 0,
          is_liked: likedIds.has(r.id),
          is_retweeted: retweetedIds.has(r.id),
          is_bookmarked: false,
        })) as Tweet[]);
      }
      setLoading(false);
    };
    load();
  }, [id, user, supabase]);

  const handleReplyPosted = (reply: Tweet) => setReplies(p => [...p, reply]);

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!tweet) return <div className={styles.notFound}>Tweet not found</div>;

  return (
    <div>
      <header className={styles.header}>
        <Link href={`/${username}`} className={styles.back}><ArrowLeft size={20} /></Link>
        <h1 className={styles.title}>Post</h1>
      </header>

      {/* Main tweet detail */}
      <div className={styles.tweetDetail}>
        <div className={styles.detailTop}>
          <Link href={`/${tweet.profile.username}`}>
            <Avatar src={tweet.profile.avatar_url} name={tweet.profile.display_name} size={46} />
          </Link>
          <div>
            <Link href={`/${tweet.profile.username}`} className={styles.detailName}>{tweet.profile.display_name}</Link>
            <div className={styles.detailUsername}>@{tweet.profile.username}</div>
          </div>
        </div>
        <p className={styles.detailText}>{tweet.content}</p>
        {tweet.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tweet.image_url} alt="tweet" className={styles.detailImage} />
        )}
        <div className={styles.detailTime}>
          {new Date(tweet.created_at).toLocaleString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true,
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </div>
        <div className={styles.detailStats}>
          {tweet.like_count > 0 && <span><strong>{tweet.like_count}</strong> Like{tweet.like_count !== 1 ? 's' : ''}</span>}
          {tweet.retweet_count > 0 && <span><strong>{tweet.retweet_count}</strong> Retweet{tweet.retweet_count !== 1 ? 's' : ''}</span>}
          {tweet.reply_count > 0 && <span><strong>{tweet.reply_count}</strong> {tweet.reply_count !== 1 ? 'Replies' : 'Reply'}</span>}
        </div>
      </div>

      {/* Reply composer */}
      {user && (
        <TweetComposer
          replyToId={tweet.id}
          onTweetPosted={handleReplyPosted}
          placeholder="Post your reply"
        />
      )}

      {/* Replies */}
      {replies.map(r => <TweetCard key={r.id} tweet={r} />)}
    </div>
  );
}
