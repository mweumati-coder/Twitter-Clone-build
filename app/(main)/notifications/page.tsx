'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Notification } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { format } from 'timeago.js';
import { Heart, Repeat2, UserPlus, MessageCircle } from 'lucide-react';
import styles from './notifications.module.css';

const iconMap = {
  like: <Heart size={18} fill="var(--danger)" color="var(--danger)" />,
  retweet: <Repeat2 size={18} color="var(--green)" />,
  follow: <UserPlus size={18} color="var(--accent)" />,
  mention: <MessageCircle size={18} color="var(--accent)" />,
  reply: <MessageCircle size={18} color="var(--accent)" />,
};

const textMap = {
  like: 'liked your tweet',
  retweet: 'retweeted your tweet',
  follow: 'followed you',
  mention: 'mentioned you',
  reply: 'replied to your tweet',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((data as Notification[]) ?? []);

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setLoading(false);
    };
    load();
  }, [user, supabase]);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
      </header>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <h3>Nothing here yet</h3>
          <p>When someone likes or follows you, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div key={n.id} className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}>
              <div className={styles.icon}>{iconMap[n.type]}</div>
              <div className={styles.content}>
                <Link href={`/${n.actor.username}`}>
                  <Avatar src={n.actor.avatar_url} name={n.actor.display_name} size={40} />
                </Link>
                <div className={styles.text}>
                  <Link href={`/${n.actor.username}`} className={styles.actorName}>
                    {n.actor.display_name}
                  </Link>{' '}
                  {textMap[n.type]}
                  <div className={styles.time}>{format(n.created_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
