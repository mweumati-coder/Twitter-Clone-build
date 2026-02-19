'use client';

import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

export default function Avatar({ src, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={styles.avatar}
        style={{ width: size, height: size, minWidth: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  const colors = [
    '#1d9bf0', '#794bc4', '#ff7900', '#00ba7c', '#f4212e',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={styles.initials}
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: size * 0.38,
        background: colors[colorIndex],
      }}
    >
      {initials}
    </div>
  );
}
