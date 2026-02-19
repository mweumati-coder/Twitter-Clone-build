'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Bell, Bookmark, User, LogOut, Twitter, Moon, Sun, FeatherIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/layout/ThemeProvider';
import styles from './Sidebar.module.css';
import Avatar from '@/components/ui/Avatar';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.nav}>
      <div className={styles.top}>
        <Link href="/home" className={styles.logo}>
          <Twitter size={28} fill="var(--accent)" color="var(--accent)" />
        </Link>

        <ul className={styles.navList}>
          {navItems.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
              >
                <Icon size={26} strokeWidth={pathname === href ? 2.5 : 2} />
                <span className={styles.navLabel}>{label}</span>
              </Link>
            </li>
          ))}
          {profile && (
            <li>
              <Link
                href={`/${profile.username}`}
                className={`${styles.navItem} ${pathname === `/${profile.username}` ? styles.active : ''}`}
              >
                <User size={26} strokeWidth={pathname === `/${profile.username}` ? 2.5 : 2} />
                <span className={styles.navLabel}>Profile</span>
              </Link>
            </li>
          )}
        </ul>

        <Link href="/compose" className={styles.tweetBtn}>
          <FeatherIcon size={20} className={styles.tweetBtnIcon} />
          <span className={styles.tweetBtnLabel}>Post</span>
        </Link>
      </div>

      <div className={styles.bottom}>
        <button onClick={toggleTheme} className={styles.themeBtn}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className={styles.navLabel}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {profile && (
          <div className={styles.profileSection}>
            <Link href={`/${profile.username}`} className={styles.profileLink}>
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name}
                size={40}
              />
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{profile.display_name}</span>
                <span className={styles.profileUsername}>@{profile.username}</span>
              </div>
            </Link>
            <button onClick={signOut} className={styles.signOutBtn} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
