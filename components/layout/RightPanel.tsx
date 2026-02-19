'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import styles from './RightPanel.module.css';
import { Search } from 'lucide-react';

export default function RightPanel() {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) ?? [];
      const exclude = [...followingIds, user.id];

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${exclude.join(',')})`)
        .limit(5);

      setSuggestions((data as Profile[]) ?? []);
    };
    fetchSuggestions();
  }, [user, supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(8);
      setSearchResults((data as Profile[]) ?? []);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleFollow = async (profileId: string) => {
    if (!user) return;
    await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
    setSuggestions(prev => prev.filter(p => p.id !== profileId));
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset demo data to defaults? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      // simple reload to pick up reset data
      window.location.reload();
    } catch (e) {
      alert('Could not reset demo data.');
    }
  };

  return (
    <div className={styles.panel}>
      {/* Search bar */}
      <div className={styles.searchBox}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search Chirp"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className={styles.searchInput}
        />
        {showResults && searchResults.length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.map(p => (
              <Link key={p.id} href={`/${p.username}`} className={styles.searchResult}>
                <Avatar src={p.avatar_url} name={p.display_name} size={38} />
                <div>
                  <div className={styles.searchName}>{p.display_name}</div>
                  <div className={styles.searchUsername}>@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Who to follow */}
      {suggestions.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Who to follow</h3>
          {suggestions.map(p => (
            <div key={p.id} className={styles.suggestion}>
              <Link href={`/${p.username}`} className={styles.suggestionLeft}>
                <Avatar src={p.avatar_url} name={p.display_name} size={44} />
                <div>
                  <div className={styles.suggestionName}>{p.display_name}</div>
                  <div className={styles.suggestionUsername}>@{p.username}</div>
                </div>
              </Link>
              <button
                onClick={() => handleFollow(p.id)}
                className={styles.followBtn}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      )}

      <p className={styles.footer}>
        © 2025 Chirp Clone · Built with Next.js & Supabase
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <button onClick={handleResetDemo} className={styles.resetBtn} style={{ marginLeft: 12 }}>
            Reset Demo
          </button>
        )}
      </p>
    </div>
  );
}
