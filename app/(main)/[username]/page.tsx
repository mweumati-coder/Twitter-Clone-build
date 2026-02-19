'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useParams, notFound } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import TweetCard from '@/components/tweet/TweetCard';
import TweetComposer from '@/components/tweet/TweetComposer';
import type { Profile, Tweet } from '@/types';
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { format } from 'timeago.js';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'tweets' | 'likes'>('tweets');

  const loadProfile = useCallback(async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (!profileData) { notFound(); return; }
    setProfile(profileData as Profile);

    const [followersRes, followingRes, followCheckRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', profileData.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', profileData.id),
      user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profileData.id).single() : Promise.resolve({ data: null }),
    ]);

    setFollowerCount(followersRes.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);
    setIsFollowing(!!followCheckRes.data);

    await loadTweets(profileData.id);
    setLoading(false);
  }, [username, user, supabase]);

  const loadTweets = async (profileId: string) => {
    const { data } = await supabase
      .from('tweets')
      .select('*, profile:profiles(*)')
      .eq('user_id', profileId)
      .is('reply_to_id', null)
      .order('created_at', { ascending: false });

    if (!data) return;

    const tweetIds = data.map(t => t.id);
    const [likesRes, retweetsRes, bookmarksRes, statsRes] = await Promise.all([
      user ? supabase.from('likes').select('tweet_id').eq('user_id', user!.id).in('tweet_id', tweetIds) : Promise.resolve({ data: [] }),
      user ? supabase.from('retweets').select('tweet_id').eq('user_id', user!.id).in('tweet_id', tweetIds) : Promise.resolve({ data: [] }),
      user ? supabase.from('bookmarks').select('tweet_id').eq('user_id', user!.id).in('tweet_id', tweetIds) : Promise.resolve({ data: [] }),
      supabase.from('tweet_stats').select('*').in('tweet_id', tweetIds),
    ]);

    const likedIds = new Set(likesRes.data?.map((l: {tweet_id: string}) => l.tweet_id));
    const retweetedIds = new Set(retweetsRes.data?.map((r: {tweet_id: string}) => r.tweet_id));
    const bookmarkedIds = new Set(bookmarksRes.data?.map((b: {tweet_id: string}) => b.tweet_id));
    const statsMap: Record<string, {like_count: number; retweet_count: number; bookmark_count: number; reply_count: number}> = {};
    statsRes.data?.forEach(s => { statsMap[s.tweet_id] = s; });

    setTweets(data.map(t => ({
      ...t,
      like_count: statsMap[t.id]?.like_count ?? 0,
      retweet_count: statsMap[t.id]?.retweet_count ?? 0,
      bookmark_count: statsMap[t.id]?.bookmark_count ?? 0,
      reply_count: statsMap[t.id]?.reply_count ?? 0,
      is_liked: likedIds.has(t.id),
      is_retweeted: retweetedIds.has(t.id),
      is_bookmarked: bookmarkedIds.has(t.id),
    })) as Tweet[]);
  };

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  const isOwnProfile = user?.id === profile?.id;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.headerTitle}>{profile.display_name}</h1>
        <p className={styles.headerSubtitle}>{tweets.length} posts</p>
      </header>

      {/* Banner */}
      <div className={styles.banner}>
        {profile.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.banner_url} alt="banner" className={styles.bannerImg} />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
      </div>

      {/* Profile info */}
      <div className={styles.profileInfo}>
        <div className={styles.avatarRow}>
          <Avatar src={profile.avatar_url} name={profile.display_name} size={120} />
          {isOwnProfile ? (
            <button className={styles.editBtn}>Edit profile</button>
          ) : user ? (
            <button
              onClick={handleFollow}
              className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          ) : null}
        </div>

        <div className={styles.nameSection}>
          <h2 className={styles.displayName}>{profile.display_name}</h2>
          <p className={styles.username}>@{profile.username}</p>
        </div>

        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

        <div className={styles.meta}>
          {profile.location && (
            <span className={styles.metaItem}>
              <MapPin size={16} /> {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className={`${styles.metaItem} ${styles.link}`}>
              <LinkIcon size={16} /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className={styles.metaItem}>
            <Calendar size={16} /> Joined {format(profile.created_at)}
          </span>
        </div>

        <div className={styles.stats}>
          <span className={styles.stat}>
            <strong>{followingCount}</strong> Following
          </span>
          <span className={styles.stat}>
            <strong>{followerCount}</strong>{' '}
            {followerCount === 1 ? 'Follower' : 'Followers'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['tweets', 'likes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Compose box for own profile */}
      {isOwnProfile && activeTab === 'tweets' && (
        <TweetComposer onTweetPosted={(t) => setTweets(prev => [t, ...prev])} />
      )}

      {/* Tweets */}
      {tweets.length === 0 ? (
        <div className={styles.empty}>
          <h3>No tweets yet</h3>
          <p>{isOwnProfile ? 'What\'s on your mind?' : `@${profile.username} hasn't posted yet.`}</p>
        </div>
      ) : (
        tweets.map(tweet => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            onDelete={id => setTweets(prev => prev.filter(t => t.id !== id))}
          />
        ))
      )}
    </div>
  );
}
