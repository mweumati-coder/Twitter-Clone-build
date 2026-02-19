// types/index.ts
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  website: string;
  location: string;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  image_url: string;
  reply_to_id: string | null;
  retweet_of_id: string | null;
  quote_content: string;
  created_at: string;
  profile: Profile;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  bookmark_count: number;
  is_liked?: boolean;
  is_retweeted?: boolean;
  is_bookmarked?: boolean;
  retweeted_tweet?: Tweet | null;
  replies?: Tweet[];
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: "like" | "retweet" | "follow" | "mention" | "reply";
  tweet_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: Profile;
  tweet?: Tweet | null;
}
