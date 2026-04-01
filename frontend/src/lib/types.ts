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

export type ScheduledPost = {
  id: number;
  platform: "instagram" | "facebook" | "both";
  type: "photo" | "reel" | "carousel" | "text";
  caption: string | null;
  media_urls: string[] | null;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  error_message: string | null;
  meta_post_id: string | null;
  ig_user_id: string | null;
  fb_page_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IgComment = {
  id: string;
  text: string;
  username: string;
  timestamp: string;
};

export type WorkspaceSocialMeta = {
  insights: {
    periods: { value: string; label: string }[];
    instagram_labels: Record<string, string>;
    facebook_labels: Record<string, string>;
    messages: {
      no_data: string;
      connect_account: string;
    };
  };
  comments: {
    messages: {
      title: string;
      connect_instagram: string;
      select_post_title: string;
      loading_posts: string;
      select_post_empty: string;
      loading_comments: string;
      empty_comments: string;
      reply_placeholder: string;
      reply: string;
      hide: string;
      delete: string;
      send: string;
      no_caption: string;
      comments_count_suffix: string;
      load_posts_error: string;
      load_comments_error: string;
      reply_error: string;
      hide_error: string;
      delete_error: string;
    };
  };
  posts: {
    platforms: { key: "instagram" | "facebook"; label: string; color: string }[];
    messages: {
      title: string;
      connect_account: string;
      loading_posts: string;
      empty_posts: string;
      instagram_delete_confirm: string;
      facebook_delete_confirm: string;
      post_updated: string;
      post_deleted: string;
      update_error: string;
      delete_error: string;
      details_title: string;
      edit_title: string;
      save_changes: string;
      view_on_instagram: string;
      instagram_caption_note: string;
      no_text: string;
      no_image: string;
      message_label: string;
    };
  };
};
