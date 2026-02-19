'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'timeago.js';
import {
  Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, Trash2,
} from 'lucide-react';
import type { Tweet } from '@/types';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import styles from './TweetCard.module.css';

interface Props {
  tweet: Tweet;
  onDelete?: (id: string) => void;
  onUpdate?: (tweet: Tweet) => void;
  showReplies?: boolean;
}

export default function TweetCard({ tweet, onDelete, onUpdate }: Props) {
  const { user } = useAuth();
  const supabase = createClient();

  const [liked, setLiked] = useState(tweet.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(tweet.like_count ?? 0);
  const [retweeted, setRetweeted] = useState(tweet.is_retweeted ?? false);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count ?? 0);
  const [bookmarked, setBookmarked] = useState(tweet.is_bookmarked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(tweet.bookmark_count ?? 0);
  const [showMenu, setShowMenu] = useState(false);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('tweet_id', tweet.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, tweet_id: tweet.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const toggleRetweet = async () => {
    if (!user) return;
    if (retweeted) {
      await supabase.from('retweets').delete().eq('user_id', user.id).eq('tweet_id', tweet.id);
      setRetweeted(false);
      setRetweetCount(c => c - 1);
    } else {
      await supabase.from('retweets').insert({ user_id: user.id, tweet_id: tweet.id });
      setRetweeted(true);
      setRetweetCount(c => c + 1);
    }
  };

  const toggleBookmark = async () => {
    if (!user) return;
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('tweet_id', tweet.id);
      setBookmarked(false);
      setBookmarkCount(c => c - 1);
      toast.success('Removed from Bookmarks');
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, tweet_id: tweet.id });
      setBookmarked(true);
      setBookmarkCount(c => c + 1);
      toast.success('Added to Bookmarks');
    }
  };

  const deleteTweet = async () => {
    if (!user || user.id !== tweet.user_id) return;
    const { error } = await supabase.from('tweets').delete().eq('id', tweet.id);
    if (!error) {
      toast.success('Tweet deleted');
      onDelete?.(tweet.id);
    }
    setShowMenu(false);
  };

  return (
    <article className={styles.card}>
      <div className={styles.avatarCol}>
        <Link href={`/${tweet.profile.username}`}>
          <Avatar src={tweet.profile.avatar_url} name={tweet.profile.display_name} size={46} />
        </Link>
      </div>

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href={`/${tweet.profile.username}`} className={styles.displayName}>
              {tweet.profile.display_name}
            </Link>
            <span className={styles.username}>@{tweet.profile.username}</span>
            <span className={styles.dot}>·</span>
            <time className={styles.time} title={tweet.created_at}>
              {format(tweet.created_at)}
            </time>
          </div>

          {user?.id === tweet.user_id && (
            <div className={styles.menuWrapper}>
              <button
                className={styles.menuBtn}
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className={styles.menu}>
                  <button onClick={deleteTweet} className={styles.menuItemDanger}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tweet text */}
        <Link href={`/${tweet.profile.username}/status/${tweet.id}`}>
          <p className={styles.text}>{tweet.content}</p>
        </Link>

        {/* Tweet image */}
        {tweet.image_url && (
          <Link href={`/${tweet.profile.username}/status/${tweet.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tweet.image_url} alt="tweet" className={styles.tweetImage} />
          </Link>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Link
            href={`/${tweet.profile.username}/status/${tweet.id}`}
            className={`${styles.action} ${styles.reply}`}
          >
            <MessageCircle size={18} />
            <span>{tweet.reply_count > 0 ? tweet.reply_count : ''}</span>
          </Link>

          <button
            onClick={toggleRetweet}
            className={`${styles.action} ${styles.retweet} ${retweeted ? styles.retweeted : ''}`}
          >
            <Repeat2 size={18} />
            <span>{retweetCount > 0 ? retweetCount : ''}</span>
          </button>

          <button
            onClick={toggleLike}
            className={`${styles.action} ${styles.like} ${liked ? styles.liked : ''}`}
          >
            <Heart size={18} fill={liked ? 'var(--danger)' : 'none'} />
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </button>

          <button
            onClick={toggleBookmark}
            className={`${styles.action} ${styles.bookmark} ${bookmarked ? styles.bookmarked : ''}`}
          >
            <Bookmark size={18} fill={bookmarked ? 'var(--accent)' : 'none'} />
            <span>{bookmarkCount > 0 ? bookmarkCount : ''}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
