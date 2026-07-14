import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  CheckCircle,
  Star,
  Share2,
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Video,
  Play,
  ArrowRight
} from 'lucide-react';
import {
  getUserRating,
  saveRating,
  getReviews,
  addReview,
  toggleLikeReview,
  addReply,
  reportReview,
  toggleWatchlist,
  getWatchlist,
  updateWatchlistStatus
} from '../db/storage';
import { Movie, Review, WatchlistStatus } from '../types';
import RovixMeter from './RovixMeter';
import { getMovieDetails } from '../lib/tmdb';

interface MovieDetailsProps {
  movieId: string;
  isTv: boolean;
  userId: string;
  onClose: () => void;
  onMovieClick: (id: string, isTv: boolean) => void;
  allMovies: Movie[];
}

export default function MovieDetails({
  movieId,
  isTv,
  userId,
  onClose,
  onMovieClick,
  allMovies
}: MovieDetailsProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus | 'not_added'>('not_added');
  const [loading, setLoading] = useState(true);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sortReviewsBy, setSortReviewsBy] = useState<'newest' | 'likes' | 'rating'>('newest');

  // Review Writer state
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState(5.0);
  const [isSpoiler, setIsSpoiler] = useState(false);

  // Interaction states
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null); // reviewId
  const [replyText, setReplyText] = useState('');
  const [activeReportBox, setActiveReportBox] = useState<string | null>(null); // reviewId
  const [reportReason, setReportReason] = useState('');

  // Status Alerts / Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load film details and states dynamically from TMDB
  const loadFilmDetails = async () => {
    setLoading(true);
    try {
      const found = await getMovieDetails(movieId, isTv);
      if (found) {
        setMovie(found);
        setUserRating(getUserRating(userId, movieId));

        // Check watchlist state
        const watchlist = getWatchlist(userId);
        const wlFound = watchlist.find(w => w.movieId === movieId);
        setWatchlistStatus(wlFound ? wlFound.status : 'not_added');

        // Load reviews
        setReviews(getReviews(movieId));
      }
    } catch (err) {
      console.error('Failed to load TMDB details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilmDetails();
  }, [movieId, userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Retrieving cinematic DNA specifications...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg">Media details not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#F5C518] text-black font-semibold rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Star Rating Handler (Supports Half Stars)
  const handleStarClick = (score: number) => {
    saveRating(userId, movie.id, score);
    setUserRating(score);
    triggerToast(`You rated "${movie.title}" ${score} Stars!`);
    loadFilmDetails();
  };

  // Watchlist toggle / status updates with Firestore parameters
  const handleWatchlistChange = (status: WatchlistStatus) => {
    updateWatchlistStatus(userId, movie.id, movie.title, movie.posterUrl, !!movie.isTvShow, status);
    setWatchlistStatus(status);
    triggerToast(`Added to Watchlist under "${status}"`);
  };

  const handleRemoveFromWatchlist = () => {
    toggleWatchlist(userId, movie.id, movie.title, movie.posterUrl, !!movie.isTvShow);
    setWatchlistStatus('not_added');
    triggerToast(`Removed from Watchlist`);
  };

  // Write Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle || !reviewBody) return;

    addReview(
      userId, 
      movie.id, 
      reviewTitle, 
      reviewBody, 
      reviewRating, 
      isSpoiler, 
      movie.title, 
      movie.posterUrl, 
      !!movie.isTvShow
    );
    triggerToast('Review published successfully!');
    
    // Reset Writer
    setReviewTitle('');
    setReviewBody('');
    setIsSpoiler(false);

    loadFilmDetails();
  };

  // Review interactions
  const handleLikeReview = (reviewId: string) => {
    toggleLikeReview(reviewId, userId);
    loadFilmDetails();
  };

  const handlePublishReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    addReply(reviewId, userId, replyText);
    setReplyText('');
    setActiveReplyBox(null);
    triggerToast('Reply posted.');
    loadFilmDetails();
  };

  const handlePublishReport = (reviewId: string) => {
    if (!reportReason.trim()) return;
    reportReview(userId, reviewId, reportReason);
    setReportReason('');
    setActiveReportBox(null);
    triggerToast('Report submitted for moderation.');
    loadFilmDetails();
  };

  const handleShare = () => {
    const fakeUrl = `${window.location.origin}/movie/${movie.id}`;
    navigator.clipboard.writeText(fakeUrl);
    triggerToast('Shareable Link Copied to Clipboard!');
  };

  // Sort Reviews helper
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortReviewsBy === 'likes') return b.likes - a.likes;
    if (sortReviewsBy === 'rating') return b.rating - a.rating;
    return b.createdAt.localeCompare(a.createdAt);
  });

  // Streaming Availability Info Map
  const STREAMING_PLATFORMS_DATA: Record<string, string> = {
    'Netflix': 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=100&auto=format&fit=crop&q=80',
    'Prime Video': 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=100&auto=format&fit=crop&q=80',
    'Disney+': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80',
    'Apple TV+': 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&auto=format&fit=crop&q=80',
    'Max': 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=100&auto=format&fit=crop&q=80'
  };

  // Filter similar recommended movies
  const similarMovies = allMovies
    .filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g)))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto pt-16 md:pt-0 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black px-6 py-3 rounded-xl font-bold shadow-2xl shadow-[#FFD700]/20 z-50 animate-bounce flex items-center space-x-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop Header block */}
      <div className="relative w-full h-[300px] md:h-[500px]">
        {/* Backdrop image */}
        <div className="absolute inset-0">
          <img src={movie.backdropUrl} alt="Backdrop" className="w-full h-full object-cover opacity-45" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/80" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-black/60 hover:bg-[#FFD700] hover:text-black border border-white/10 rounded-full transition-all duration-300 text-white z-20 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Floating Poster + Title Block (Aligned desktop/mobile) */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 pb-6 flex flex-col md:flex-row items-center md:items-end md:space-x-8 text-center md:text-left">
          <div className="w-36 md:w-56 aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 shrink-0 transform -translate-y-4 md:translate-y-0">
            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="mt-2 md:mt-0 pb-2 space-y-2">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {movie.genres.map((g, idx) => (
                <span key={idx} className="bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {g}
                </span>
              ))}
              <span className="bg-zinc-800 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                {movie.isTvShow ? 'TV Show' : 'Movie'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white">{movie.title}</h1>
            {movie.tagline && <p className="text-gray-400 italic text-sm md:text-lg font-sans">"{movie.tagline}"</p>}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm text-gray-400 font-mono">
              <span>{movie.releaseDate.split('-')[0]}</span>
              <span>•</span>
              <span>{movie.isTvShow ? `${(movie as any).seasons} Seasons` : `${movie.runtime} min`}</span>
              <span>•</span>
              <div className="flex items-center space-x-1.5 text-[#FFD700] hover:scale-105 transition-transform duration-300">
                <RovixMeter score={Math.round(movie.communityRating * 20)} size={30} strokeWidth={3} showLabel={false} />
                <span className="font-extrabold tracking-tight font-sans text-xs">🔥 Rovix Meter™ {Math.round(movie.communityRating * 20)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left 2 Columns: Metadata, Cast, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview block */}
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-3 shadow-xl">
            <h2 className="text-xl font-bold font-display text-white">Storyline</h2>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">{movie.overview}</p>
          </div>

          {/* Cast Members */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-sans text-white">Starring Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {movie.cast.map((c, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-white/5 p-3 rounded-xl flex items-center space-x-3">
                  <img src={c.profileUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{c.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trailer section */}
          {movie.trailerUrl && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-white flex items-center space-x-2">
                <Video className="w-5 h-5 text-[#FFD700]" />
                <span>Trailer & Video clips</span>
              </h2>
              <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-white/5">
                <iframe
                  src={movie.trailerUrl}
                  title={`${movie.title} Trailer`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* COMMUNITY REVIEWS SYSTEM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold font-display text-white">Community Notes ({reviews.length})</h2>
              <div className="flex space-x-2 text-xs font-mono">
                <button
                  onClick={() => setSortReviewsBy('newest')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition ${sortReviewsBy === 'newest' ? 'bg-[#FFD700] text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortReviewsBy('likes')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition ${sortReviewsBy === 'likes' ? 'bg-[#FFD700] text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  Popular
                </button>
                <button
                  onClick={() => setSortReviewsBy('rating')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition ${sortReviewsBy === 'rating' ? 'bg-[#FFD700] text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
                >
                  Ratings
                </button>
              </div>
            </div>

            {/* Write a review form */}
            <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-[2rem] space-y-4">
              <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider font-mono">Log a review note</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-semibold mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      placeholder="e.g. Masterclass in audio scale..."
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-semibold mb-1">Star Score for Review ({reviewRating})</label>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.5"
                      value={reviewRating}
                      onChange={e => setReviewRating(parseFloat(e.target.value))}
                      className="w-full accent-[#FFD700] bg-zinc-950 h-2 rounded-lg cursor-pointer mt-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1">Review Body</label>
                  <textarea
                    required
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    placeholder="Describe your critical thoughts on acting, direction, tone, cinematography..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none text-sm leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                      isSpoiler
                        ? 'bg-red-500/10 border-red-500 text-red-400 font-semibold'
                        : 'border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {isSpoiler ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Spoiler Alert Toggle</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-[#FFD700]/10 cursor-pointer"
                  >
                    Publish Review
                  </button>
                </div>
              </form>
            </div>

            {/* List Reviews */}
            {sortedReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic text-sm">
                No reviews yet. Be the first to publish critical notes on {movie.title}!
              </div>
            ) : (
              <div className="space-y-4">
                {sortedReviews.map(rev => {
                  const hasLiked = rev.likedBy.includes(userId);
                  const isReplyBoxOpen = activeReplyBox === rev.id;
                  const isReportBoxOpen = activeReportBox === rev.id;

                  return (
                    <div key={rev.id} className="bg-zinc-900/30 border border-white/5 p-5 rounded-xl space-y-4 relative">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={rev.userAvatar} alt={rev.username} className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <span className="font-semibold text-white text-sm">@{rev.username}</span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5 font-mono">
                              <span className="flex items-center text-[#FFD700]">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(rev.rating) ? 'fill-current' : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 font-semibold">{rev.rating}</span>
                              </span>
                              <span>•</span>
                              <span>{rev.createdAt}</span>
                            </div>
                          </div>
                        </div>

                        {rev.isSpoiler && (
                          <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono rounded">
                            SPOILERS
                          </span>
                        )}
                      </div>

                      {/* Title & Body */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-white text-md">{rev.title}</h4>
                        
                        {rev.isSpoiler ? (
                          <SpoilerReviewBody body={rev.body} />
                        ) : (
                          <p className="text-gray-300 text-sm leading-relaxed">{rev.body}</p>
                        )}
                      </div>

                      {/* Interactions Row */}
                      <div className="flex items-center space-x-4 border-t border-white/5 pt-3 text-xs text-gray-400">
                        <button
                          onClick={() => handleLikeReview(rev.id)}
                          className={`flex items-center space-x-1.5 hover:text-white transition cursor-pointer ${
                            hasLiked ? 'text-[#FFD700] font-semibold' : ''
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{rev.likes}</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveReplyBox(isReplyBoxOpen ? null : rev.id);
                            setActiveReportBox(null);
                          }}
                          className={`flex items-center space-x-1.5 hover:text-white transition ${
                            isReplyBoxOpen ? 'text-white' : ''
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{rev.replies.length} Replies</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveReportBox(isReportBoxOpen ? null : rev.id);
                            setActiveReplyBox(null);
                          }}
                          className={`flex items-center space-x-1.5 hover:text-red-400 transition ml-auto ${
                            isReportBoxOpen ? 'text-red-400' : ''
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      </div>

                      {/* Actions Boxes */}
                      {isReplyBoxOpen && (
                        <div className="bg-zinc-950 p-4 rounded-lg border border-white/5 space-y-3">
                          {rev.replies.map((reply, idx) => (
                            <div key={idx} className="flex space-x-3 text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                              <img src={reply.userAvatar} alt={reply.username} className="w-6 h-6 rounded-full object-cover" />
                              <div className="space-y-0.5">
                                <p className="font-semibold text-white">@{reply.username} <span className="text-[10px] text-gray-500 font-normal">{reply.createdAt}</span></p>
                                <p className="text-gray-300">{reply.body}</p>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center space-x-2 mt-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a comment response..."
                              className="flex-1 bg-zinc-900 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:border-[#FFD700] outline-none"
                            />
                            <button
                              onClick={() => handlePublishReply(rev.id)}
                              className="p-2.5 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black rounded-xl transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {isReportBoxOpen && (
                        <div className="bg-zinc-950 p-4 rounded-lg border border-red-500/20 space-y-3">
                          <p className="text-xs text-red-400 font-semibold">Flag review for moderation review?</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={reportReason}
                              onChange={e => setReportReason(e.target.value)}
                              placeholder="Reason (spam, offensive, major spoilers unflagged)..."
                              className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-red-500 outline-none"
                            />
                            <button
                              onClick={() => handlePublishReport(rev.id)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Submit Flag
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>

        {/* Right 1 Column: Actions and General Production Information */}
        <div className="space-y-6">
          
          {/* Action Hub */}
          {movie.status === 'Upcoming' ? (
            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-5 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-black text-lg text-[#FFD700] tracking-tight">📈 Hype Index™</h3>
                <span className="bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold px-2 py-0.5 rounded font-mono">ANTICIPATED</span>
              </div>
              
              {/* Countdown timer */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono block">Countdown to Release</span>
                <Countdown releaseDate={movie.releaseDate} />
              </div>

              {/* Interested Indicator */}
              <InterestedIndicator movieId={movie.id} userId={userId} />

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold rounded-xl transition shadow-lg shadow-[#FFD700]/10 text-xs tracking-wider uppercase cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Upcoming Title</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-5 shadow-xl">
              <h3 className="font-display font-bold text-lg text-white">Log your Activity</h3>
              
              {/* Watchlist Buttons */}
              <div className="space-y-3">
              {watchlistStatus === 'not_added' ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-semibold font-mono">Watchlist Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWatchlistChange('Plan to Watch')}
                      className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-zinc-950 border border-white/5 hover:border-white/10 rounded-xl text-xs transition cursor-pointer text-gray-200"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-gray-400" />
                      <span>Plan to Watch</span>
                    </button>
                    <button
                      onClick={() => handleWatchlistChange('Watching')}
                      className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-zinc-950 border border-white/5 hover:border-white/10 rounded-xl text-xs transition cursor-pointer text-gray-200"
                    >
                      <Play className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>Watching Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Watch Status:</span>
                    <span className="px-2 py-0.5 bg-[#FFD700] text-black font-bold rounded text-[10px] uppercase font-mono">{watchlistStatus}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Plan to Watch', 'Watching', 'Completed', 'Favorites'] as WatchlistStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => handleWatchlistChange(status)}
                        className={`py-1 rounded font-mono text-[9px] border transition cursor-pointer ${
                          watchlistStatus === status
                            ? 'bg-[#FFD700] text-black border-[#FFD700] font-bold'
                            : 'bg-zinc-900 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {status.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleRemoveFromWatchlist}
                    className="w-full py-1.5 text-red-400 hover:text-red-300 font-semibold text-[10px] text-center cursor-pointer"
                  >
                    Remove from Watchlist
                  </button>
                </div>
              )}

              {/* Quick Rate Slider (0.5 to 5.0) */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-semibold font-mono">Your Personal Rating:</span>
                  <span className="text-xs font-bold text-[#FFD700] font-mono">{userRating > 0 ? `${userRating} Stars` : 'Not Rated'}</span>
                </div>

                <div className="flex justify-between items-center space-x-1.5 font-mono">
                  {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      className={`flex-1 py-1 text-center font-mono text-[9px] rounded-md transition cursor-pointer ${
                        userRating === star
                          ? 'bg-[#FFD700] text-black font-extrabold'
                          : userRating >= star
                          ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                          : 'bg-zinc-900 text-gray-500 hover:text-white'
                      }`}
                      title={`${star} Stars`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share & Actions list */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold rounded-xl transition shadow-lg shadow-[#FFD700]/10 text-xs tracking-wider uppercase cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Rovix Entry</span>
              </button>
            </div>
          </div>
          )}

          {/* Streaming Platform availability */}
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
            <h3 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wider">Streaming Availability</h3>
            <div className="flex flex-wrap gap-3">
              {movie.streamingPlatforms.map((platform) => {
                const img = STREAMING_PLATFORMS_DATA[platform];
                return (
                  <div key={platform} className="flex items-center space-x-2 bg-zinc-950 p-2.5 rounded-xl border border-white/5 grow shrink-0 min-w-[120px]">
                    <img src={img || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=100'} alt={platform} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    <span className="text-xs font-semibold text-white">{platform}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl space-y-4 text-xs font-mono">
            <h3 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wider">Production Specs</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">DIRECTOR</span>
                <span className="text-white font-semibold">{movie.director}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">STATUS</span>
                <span className="text-white font-semibold">{movie.status}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">RELEASE DATE</span>
                <span className="text-white font-semibold">{movie.releaseDate}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">ORIGINAL LANGUAGE</span>
                <span className="text-white font-semibold">{movie.language}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">BUDGET</span>
                <span className="text-white font-semibold">{movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">REVENUE</span>
                <span className="text-white font-semibold">{movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : 'N/A'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Sub-component for spoiler tags
function SpoilerReviewBody({ body }: { body: string }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div className="space-y-2">
        <p className="text-gray-300 text-sm leading-relaxed">{body}</p>
        <button onClick={() => setRevealed(false)} className="text-[10px] text-[#FFD700] font-semibold cursor-pointer">Hide Spoilers</button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-red-500/20 flex flex-col items-center justify-center space-y-2.5">
      <p className="text-xs text-red-400 font-bold tracking-wide flex items-center">
        <EyeOff className="w-4 h-4 mr-1" /> WARNING: SPOILERS AHEAD
      </p>
      <button
        onClick={() => setRevealed(true)}
        className="px-4 py-1.5 bg-red-500 text-white font-bold rounded-lg text-xs hover:bg-red-400 transition"
      >
        Reveal Review Body
      </button>
    </div>
  );
}

// Countdown timer sub-component
function Countdown({ releaseDate }: { releaseDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(releaseDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [releaseDate]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center text-white font-mono">
      <div className="bg-white/5 p-2 rounded-lg">
        <span className="text-lg font-black text-[#FFD700] block">{timeLeft.days}</span>
        <span className="text-[9px] text-gray-500 uppercase">Days</span>
      </div>
      <div className="bg-white/5 p-2 rounded-lg">
        <span className="text-lg font-black text-[#FFD700] block">{timeLeft.hours}</span>
        <span className="text-[9px] text-gray-500 uppercase">Hrs</span>
      </div>
      <div className="bg-white/5 p-2 rounded-lg">
        <span className="text-lg font-black text-[#FFD700] block">{timeLeft.minutes}</span>
        <span className="text-[9px] text-gray-500 uppercase">Min</span>
      </div>
      <div className="bg-white/5 p-2 rounded-lg">
        <span className="text-lg font-black text-[#FFD700] block">{timeLeft.seconds}</span>
        <span className="text-[9px] text-gray-500 uppercase">Sec</span>
      </div>
    </div>
  );
}

// Interested Anticipation Indicator
function InterestedIndicator({ movieId, userId }: { movieId: string; userId: string }) {
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(142);

  useEffect(() => {
    const key = `rovix_interested_${movieId}`;
    const userInterestedKey = `rovix_user_interested_${userId}_${movieId}`;
    
    const count = localStorage.getItem(key) ? parseInt(localStorage.getItem(key)!) : (142 + (movieId === 'up_1' ? 88 : 41));
    setInterestCount(count);

    const userInterest = localStorage.getItem(userInterestedKey) === 'true';
    setInterested(userInterest);
  }, [movieId, userId]);

  const handleInterestToggle = () => {
    const key = `rovix_interested_${movieId}`;
    const userInterestedKey = `rovix_user_interested_${userId}_${movieId}`;

    if (interested) {
      const nextCount = interestCount - 1;
      localStorage.setItem(key, nextCount.toString());
      localStorage.setItem(userInterestedKey, 'false');
      setInterestCount(nextCount);
      setInterested(false);
    } else {
      const nextCount = interestCount + 1;
      localStorage.setItem(key, nextCount.toString());
      localStorage.setItem(userInterestedKey, 'true');
      setInterestCount(nextCount);
      setInterested(true);
    }
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3 font-sans">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400 font-medium">Total Anticipation:</span>
        <span className="text-[#FFD700] font-mono font-bold">{interestCount} Fans</span>
      </div>
      <button
        onClick={handleInterestToggle}
        className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition flex items-center justify-center space-x-2 cursor-pointer border ${
          interested
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
            : 'bg-[#FFD700] border-[#FFD700] hover:bg-[#FFD700]/90 text-black'
        }`}
      >
        <span>🔥 {interested ? 'Anticipating Release' : 'Interested'}</span>
      </button>
    </div>
  );
}
