export type AuthStatus = {
  instagram: {
    connected: boolean;
    userId: string | null;
  };
  facebook: {
    connected: boolean;
    pageId: string | null;
    pageName: string | null;
  };
};

export type InstagramProfile = {
  id: string;
  username: string;
  name: string;
  biography?: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
  website?: string;
};

export type MediaItem = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
};

export type InsightMetric = {
  name: string;
  period: string;
  values: { value: number; end_time: string }[];
  title: string;
  description: string;
};

export type FacebookPage = {
  id: string;
  name: string;
  fan_count?: number;
  followers_count?: number;
  about?: string;
  picture?: { data: { url: string } };
  cover?: { source: string };
  website?: string;
};

export type FacebookPost = {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
};
