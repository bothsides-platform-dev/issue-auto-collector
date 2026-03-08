export type SiteName = 'dcinside' | 'fmkorea' | 'ppomppu' | 'ruliweb' | 'theqoo' | 'instiz';

export interface TrendingPost {
  id: string;
  title: string;
  sourceUrl: string;
  sourceSite: SiteName;
  category?: string;
  author?: string;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  createdAt?: string;
  collectedAt: string;
  content: string;
  imageUrls?: string[];
}

export interface SiteConfig {
  name: SiteName;
  listUrl: string;
  baseUrl: string;
  maxRequestsPerMinute: number;
}

export interface ScraperResult {
  site: SiteName;
  posts: TrendingPost[];
  error?: string;
  collectedAt: string;
}

export interface CollectionResult {
  collectedAt: string;
  results: ScraperResult[];
  totalPosts: number;
}

export interface PostListItem {
  title: string;
  url: string;
  category?: string;
  author?: string;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  createdAt?: string;
}

export interface PostDetail {
  content: string;
  imageUrls?: string[];
}
