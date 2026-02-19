'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import Avatar from '@/components/ui/Avatar';
import { Image as ImageIcon, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Tweet } from '@/types';
import styles from './TweetComposer.module.css';

interface Props {
  onTweetPosted?: (tweet: Tweet) => void;
  replyToId?: string;
  placeholder?: string;
}

export default function TweetComposer({ onTweetPosted, replyToId, placeholder }: Props) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const supabase = createClient();

  const charLimit = 280;
  const remaining = charLimit - content.length;
  const overLimit = remaining < 0;
  const nearLimit = remaining <= 20;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!content.trim() && !imageFile) return;
    if (overLimit) return;

    setLoading(true);
    let imageUrl = '';

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('tweet-images')
        .upload(path, imageFile);
      if (uploadError) {
        toast.error('Failed to upload image');
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('tweet-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('tweets')
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        reply_to_id: replyToId ?? null,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      toast.error('Failed to post tweet');
    } else {
      const tweet: Tweet = {
        ...(data as Tweet),
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
        bookmark_count: 0,
        is_liked: false,
        is_retweeted: false,
        is_bookmarked: false,
      };
      setContent('');
      removeImage();
      onTweetPosted?.(tweet);
      toast.success(replyToId ? 'Reply posted!' : 'Tweet posted!');
    }
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className={styles.composer}>
      <div className={styles.inner}>
        <Avatar src={profile.avatar_url} name={profile.display_name} size={46} />
        <div className={styles.right}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={placeholder ?? "What's happening?!"}
            className={styles.textarea}
            rows={3}
            maxLength={charLimit + 1}
          />

          {imagePreview && (
            <div className={styles.imagePreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" />
              <button type="button" onClick={removeImage} className={styles.removeImage}>
                <X size={16} />
              </button>
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={styles.iconBtn}
                title="Add image"
              >
                <ImageIcon size={20} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>

            <div className={styles.footerRight}>
              {content.length > 0 && (
                <span
                  className={`${styles.charCount} ${nearLimit ? styles.nearLimit : ''} ${overLimit ? styles.overLimit : ''}`}
                >
                  {remaining}
                </span>
              )}
              <button
                type="submit"
                disabled={loading || (!content.trim() && !imageFile) || overLimit}
                className={styles.submitBtn}
              >
                {loading ? <Loader size={16} className="spin" /> : (replyToId ? 'Reply' : 'Post')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
