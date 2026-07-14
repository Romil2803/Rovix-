export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  favoriteGenres: string[];
  joinedDate: string;
  followersCount: number;
  followingCount: number;
  isAdmin: boolean;
}

export interface CastMember {
  name: string;
  character: string;
  profileUrl: string;
}

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  backdropUrl: string;
  posterUrl: string;
  genres: string[];
  runtime: number; // in minutes
  releaseDate: string;
  language: string;
  country: string;
  status: string;
  budget: number;
  revenue: number;
  director: string;
  cast: CastMember[];
  productionCompanies: string[];
  trailerUrl: string;
  gallery: string[];
  streamingPlatforms: string[];
  rating: number; // TMDB average or overall average
  communityRating: number; // Rovix internal average
  totalRatingsCount: number;
  isTvShow?: boolean;
  seasons?: number;
  episodes?: number;
}

export interface TVShow extends Movie {
  isTvShow: true;
  seasons: number;
  episodes: number;
}

export interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  isTvShow: boolean;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  body: string;
  rating: number;
  isSpoiler: boolean;
  likes: number;
  likedBy: string[]; // userIds
  replies: Reply[];
  isReported: boolean;
  createdAt: string;
}

export interface Reply {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  body: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  movieId: string;
  rating: number; // 0.5 to 5.0
  createdAt: string;
}

export type WatchlistStatus = 'Watching' | 'Plan to Watch' | 'Completed' | 'Favorites';

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  isTvShow: boolean;
  status: WatchlistStatus;
  addedAt: string;
}

export interface Follow {
  followerId: string; // user who clicked follow
  followingId: string; // user being followed
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetId: string; // review ID
  targetType: 'review';
  reason: string;
  createdAt: string;
  resolved: boolean;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  type: 'follow' | 'like' | 'reply' | 'release' | 'news';
  senderName: string;
  senderAvatar: string;
  content: string;
  targetId?: string; // e.g., movie ID or review ID
  createdAt: string;
  isRead: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  badge?: string;
}
