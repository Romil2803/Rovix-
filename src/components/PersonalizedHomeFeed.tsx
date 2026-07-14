import React, { useMemo, useState } from 'react';
import { 
  Sparkles, Flame, Users, Star, Compass, Play, BookOpen, Heart, 
  Tv, Eye, Clock, Award, ShieldAlert, ArrowUpRight, Plus, HelpCircle 
} from 'lucide-react';
import { Movie, User, Review, WatchlistItem } from '../types';
import { 
  getWatchlist, getCollections, addReviewReaction, awardXP, getCurrentUser 
} from '../db/storage';

interface PersonalizedHomeFeedProps {
  currentUser: User;
  allMovies: Movie[];
  allReviews: Review[];
  usersList: User[];
  followsList: { followerId: string; followingId: string }[];
  onMovieClick: (id: string, isTv: boolean) => void;
  onQuickWatchlist: (e: React.MouseEvent, movie: Movie) => void;
  onQuickRate: (movieId: string, rating: number) => void;
}

export default function PersonalizedHomeFeed({
  currentUser,
  allMovies,
  allReviews,
  usersList,
  followsList,
  onMovieClick,
  onQuickWatchlist,
  onQuickRate
}: PersonalizedHomeFeedProps) {
  
  // States
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<'taste' | 'gems' | 'streaming'>('taste');
  const [xpToast, setXpToast] = useState<string | null>(null);

  const showXpToast = (message: string) => {
    setXpToast(message);
    setTimeout(() => setXpToast(null), 3500);
  };

  // Get followed user IDs
  const followedUserIds = useMemo(() => {
    return followsList
      .filter(f => f.followerId === currentUser.id)
      .map(f => f.followingId);
  }, [followsList, currentUser.id]);

  // 1. Calculate Movie DNA
  const userDNA = useMemo(() => {
    const userWatchlist = getWatchlist(currentUser.id);
    const completedItems = userWatchlist.filter(w => w.status === 'Completed');
    
    // Count genres
    const counts: Record<string, number> = {};
    completedItems.forEach(item => {
      const movie = allMovies.find(m => m.id === item.movieId);
      if (movie && movie.genres) {
        movie.genres.forEach(g => {
          counts[g] = (counts[g] || 0) + 1;
        });
      }
    });

    // Also factor in reviews
    const userReviews = allReviews.filter(r => r.userId === currentUser.id);
    userReviews.forEach(rev => {
      const movie = allMovies.find(m => m.id === rev.movieId);
      if (movie && movie.genres) {
        movie.genres.forEach(g => {
          counts[g] = (counts[g] || 0) + 1;
        });
      }
    });

    // Get dominant genre
    let dominantGenre = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([g, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantGenre = g;
      }
    });

    if (!dominantGenre && currentUser.favoriteGenres && currentUser.favoriteGenres.length > 0) {
      dominantGenre = currentUser.favoriteGenres[0];
    }

    // Determine archetype profile
    switch (dominantGenre) {
      case 'Sci-Fi':
      case 'Adventure':
        return {
          archetype: 'Cosmic Voyager 🌌',
          desc: 'You are drawn to planetary physics, warp speeds, black hole timelines, and high-concept cosmic spectacles.',
          tags: ['Astrophysics', 'Time Travel', 'Synthwave Score'],
          genre: 'Sci-Fi'
        };
      case 'Drama':
      case 'Thriller':
        return {
          archetype: 'Dramatic Noir Critic ⏳',
          desc: 'You crave psychological thrillers, deep screenplays, high structural tension, and brooding auteur works.',
          tags: ['Psychological', 'Auteur', 'Moody Score'],
          genre: 'Drama'
        };
      case 'Animation':
      case 'Fantasy':
        return {
          archetype: 'Aesthetic Dreamer 🌸',
          desc: 'You cherish Ghibli frames, cozy soundscapes, nostalgia, and beautiful hand-drawn animations.',
          tags: ['Ghibli Lore', 'Nostalgia', 'Cozy Vibes'],
          genre: 'Animation'
        };
      case 'Action':
      case 'Comedy':
        return {
          archetype: 'Adrenaline Seeker 💥',
          desc: 'You seek gravity-defying blockbusters, epic fight chorography, witty jokes, and grand scale set-pieces.',
          tags: ['High Octane', 'Masala Action', 'Vibrant Gradients'],
          genre: 'Action'
        };
      case 'Horror':
        return {
          archetype: 'Gothic Specter Hunter 👁️',
          desc: 'You actively hunt demonic jump scares, psychological terror, and chilling atmospheric horror.',
          tags: ['Spooky', 'Voodoo', 'Nightmares'],
          genre: 'Horror'
        };
      default:
        return {
          archetype: 'Cinephile Explorer 🎬',
          desc: 'You have a highly balanced cinematic palate. You appreciate diverse indie blockbusters, world cinema, and drama.',
          tags: ['Eclectic Palate', 'World Cinema', 'Festival Picks'],
          genre: 'Drama'
        };
    }
  }, [allMovies, allReviews, currentUser]);

  // 2. Real-Time Activity Feed
  const activityFeed = useMemo(() => {
    const feed: {
      id: string;
      userId: string;
      username: string;
      userAvatar: string;
      type: 'watched' | 'rated' | 'reviewed';
      movieTitle: string;
      moviePoster: string;
      movieId: string;
      rating?: number;
      reviewTitle?: string;
      reviewBody?: string;
      createdAt: string;
    }[] = [];

    // Gather followed users
    const targetUsers = followedUserIds.length > 0 ? followedUserIds : usersList.map(u => u.id).filter(id => id !== currentUser.id);

    targetUsers.forEach(fId => {
      const friendObj = usersList.find(u => u.id === fId);
      if (!friendObj) return;

      // Completed watches
      const watchlist = getWatchlist(fId);
      const completed = watchlist.filter(w => w.status === 'Completed');
      completed.forEach(item => {
        feed.push({
          id: `act_w_${item.id}`,
          userId: fId,
          username: friendObj.username,
          userAvatar: friendObj.avatarUrl,
          type: 'watched',
          movieTitle: item.movieTitle,
          moviePoster: item.moviePoster,
          movieId: item.movieId,
          createdAt: item.addedAt
        });
      });

      // Reviews
      const reviews = allReviews.filter(r => r.userId === fId);
      reviews.forEach(r => {
        feed.push({
          id: `act_r_${r.id}`,
          userId: fId,
          username: friendObj.username,
          userAvatar: friendObj.avatarUrl,
          type: 'reviewed',
          movieTitle: r.movieTitle,
          moviePoster: r.moviePoster,
          movieId: r.movieId,
          rating: r.rating,
          reviewTitle: r.title,
          reviewBody: r.body,
          createdAt: r.createdAt
        });
      });
    });

    // Sort feed by date descending
    return feed.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  }, [followedUserIds, usersList, allReviews, currentUser.id]);

  // 3. Recommended Movies based on Taste DNA & Favorite Genres
  const recommendedMovies = useMemo(() => {
    const userFavs = currentUser.favoriteGenres || [];
    const dnaGenre = userDNA.genre;
    
    return allMovies.filter(m => {
      const matchFav = m.genres?.some(g => userFavs.includes(g));
      const matchDna = m.genres?.includes(dnaGenre);
      return matchFav || matchDna;
    }).slice(0, 6);
  }, [allMovies, currentUser, userDNA]);

  // 4. Smart Discovery Filters
  // Hidden Gems: rating > 4.2 with lower popularity / low budget
  const hiddenGems = useMemo(() => {
    return allMovies.filter(m => {
      const rating = m.communityRating || 0;
      return rating >= 4.2 && (m.genres?.includes('Drama') || m.genres?.includes('Animation'));
    }).slice(0, 5);
  }, [allMovies]);

  // Leaving Streaming Soon / Recently Added Mock statuses (Netflix, Prime, Hotstar badges)
  const streamingMovies = useMemo(() => {
    return [
      {
        movie: allMovies[0] || {} as Movie,
        platform: 'Netflix',
        status: 'Leaving on Friday',
        isLeaving: true
      },
      {
        movie: allMovies[2] || {} as Movie,
        platform: 'Prime Video',
        status: 'Recently Added',
        isLeaving: false
      },
      {
        movie: allMovies[1] || {} as Movie,
        platform: 'Disney+ Hotstar',
        status: 'Leaving in 3 days',
        isLeaving: true
      },
      {
        movie: allMovies[3] || {} as Movie,
        platform: 'Netflix',
        status: 'Recently Added',
        isLeaving: false
      }
    ].filter(s => s.movie && s.movie.id);
  }, [allMovies]);

  // Review reaction click
  const handleReactClick = async (reviewId: string, type: 'helpful' | 'lovedIt' | 'greatAnalysis' | 'funny' | 'mindBlown') => {
    await addReviewReaction(reviewId, type, currentUser.id);
    showXpToast(`+5 XP Earned! Sent ${type} Reaction! Sparkle Core Active! ✨`);
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28">
      {/* XP Toast Notification */}
      {xpToast && (
        <div className="fixed top-24 right-6 bg-[#F5C518] text-black px-5 py-3 rounded-2xl font-black shadow-2xl z-50 animate-bounce flex items-center space-x-2 border border-white/10 text-xs">
          <span>{xpToast}</span>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col justify-end p-6 md:p-10">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop" 
            alt="Gradient" 
            className="w-full h-full object-cover opacity-15" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Welcome name */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-[#F5C518]/15 border border-[#F5C518]/30 text-[#F5C518] px-3 py-1 rounded-full font-mono font-black text-[9px] uppercase tracking-wider">
                Level {currentUser.level || 1} Cinephile
              </span>
              <span className="text-zinc-500 font-mono text-[9px] font-bold">
                XP: {currentUser.xp || 0} / {(currentUser.level || 1) * 200}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-sans text-white uppercase tracking-tight">
              WELCOME BACK, <span className="text-[#F5C518]">@{currentUser.username}</span>
            </h1>
            <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-xl font-medium">
              Explore your movie DNA, track cinema availability, join communities, and synchronise your watch log in real time.
            </p>
          </div>

          {/* Cinematic DNA Card */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] space-y-2 text-xs">
            <span className="text-[9px] text-[#F5C518] font-mono font-black uppercase tracking-widest flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#F5C518]" /> YOUR CINEMATIC DNA
            </span>
            <p className="font-black text-white text-base leading-none">{userDNA.archetype}</p>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-medium line-clamp-2">
              {userDNA.desc}
            </p>
            <div className="flex gap-1.5 flex-wrap pt-1">
              {userDNA.tags.map((tag, idx) => (
                <span key={idx} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-[8px] text-zinc-400 font-mono font-bold uppercase">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns: Main recommendation feeds & Left/Right activity stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* 1. Tailored Recommendations */}
          <div className="space-y-4">
            <h3 className="text-xl font-sans font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-[#F5C518]" />
              <span>Tailored recommendations</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {recommendedMovies.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => onMovieClick(movie.id, !!movie.isTvShow)}
                  className="bg-zinc-950 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-[#F5C518]/30 transition duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3]">
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-0.5 text-[#F5C518] text-[9px] font-mono font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{movie.communityRating}</span>
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1 text-xs">
                    <p className="font-black text-white truncate uppercase tracking-tight group-hover:text-[#F5C518] transition">{movie.title}</p>
                    <p className="text-[10px] text-zinc-500 font-mono font-bold">{movie.genres[0]} • {movie.isTvShow ? 'TV Series' : 'Movie'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Smart Discovery Panels */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 font-sans">
                <Compass className="w-5.5 h-5.5 text-[#F5C518]" />
                <span>Smart Discovery Hub</span>
              </h3>
              
              <div className="flex gap-2 text-[10px] font-mono font-bold uppercase">
                <button
                  onClick={() => setActiveDiscoveryTab('taste')}
                  className={`px-3 py-1 rounded-lg border transition ${
                    activeDiscoveryTab === 'taste' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'bg-zinc-900 border-white/5 text-gray-400'
                  }`}
                >
                  Taste Match
                </button>
                <button
                  onClick={() => setActiveDiscoveryTab('gems')}
                  className={`px-3 py-1 rounded-lg border transition ${
                    activeDiscoveryTab === 'gems' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'bg-zinc-900 border-white/5 text-gray-400'
                  }`}
                >
                  Hidden Gems
                </button>
                <button
                  onClick={() => setActiveDiscoveryTab('streaming')}
                  className={`px-3 py-1 rounded-lg border transition ${
                    activeDiscoveryTab === 'streaming' ? 'bg-[#F5C518] text-black border-[#F5C518]' : 'bg-zinc-900 border-white/5 text-gray-400'
                  }`}
                >
                  On Streaming
                </button>
              </div>
            </div>

            {/* Discovery Content */}
            {activeDiscoveryTab === 'taste' && (
              <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2.5rem] space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🧬</span>
                  <p className="text-xs font-bold text-white uppercase font-mono tracking-widest text-[#F5C518]">Based on your Taste Spectrum</p>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl font-medium">
                  We analysed your rating logs for {userDNA.genre} films. Our smart filter recommends watching high-scoring auteur films that match these exact characteristics:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  {recommendedMovies.slice(0, 2).map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => onMovieClick(m.id, !!m.isTvShow)}
                      className="p-3 bg-zinc-950 border border-white/5 rounded-xl hover:border-white/10 transition cursor-pointer flex items-center space-x-3"
                    >
                      <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded-md" />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{m.title}</p>
                        <p className="text-[10px] text-[#F5C518] font-mono mt-0.5 flex items-center">
                          <Star className="w-3 h-3 fill-current mr-0.5" /> {m.communityRating}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDiscoveryTab === 'gems' && (
              <div className="space-y-3.5">
                <p className="text-xs text-zinc-400 font-medium">Critical masterpieces with exceptional ratings and budgets but low voting density.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hiddenGems.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => onMovieClick(m.id, !!m.isTvShow)}
                      className="bg-zinc-950 border border-white/5 p-3.5 rounded-2.5xl hover:border-[#F5C518]/30 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded-xl" />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate group-hover:text-[#F5C518] transition">{m.title}</p>
                          <p className="text-[10px] text-[#F5C518] font-mono font-bold mt-0.5">{m.genres[0]} • IMDb {m.communityRating}</p>
                        </div>
                      </div>
                      <span className="bg-amber-400/10 border border-amber-400/20 text-[#F5C518] px-2 py-1 rounded-lg text-[8px] font-mono font-black uppercase shrink-0">
                        98% MATCH
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDiscoveryTab === 'streaming' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {streamingMovies.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => onMovieClick(item.movie.id, !!item.movie.isTvShow)}
                    className="bg-[#111111]/90 border border-white/5 p-4 rounded-2.5xl flex items-center justify-between hover:border-white/10 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img src={item.movie.posterUrl} alt={item.movie.title} className="w-9 h-12 object-cover rounded-lg" />
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-white truncate">{item.movie.title}</p>
                        <p className="text-[10px] text-zinc-500 font-mono font-bold">{item.platform}</p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider shrink-0 ${
                      item.isLeaving 
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse' 
                        : 'bg-green-500/10 border border-green-500/20 text-green-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Real-Time Activity Feed Column */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-lg font-sans font-black tracking-tight text-white uppercase flex items-center gap-1.5">
              <Users className="w-5.5 h-5.5 text-[#F5C518]" />
              <span>Network activity</span>
            </h3>
            <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[8px] font-mono font-black animate-pulse flex items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> LIVE SNAP
            </span>
          </div>

          <div className="space-y-4">
            {activityFeed.length === 0 ? (
              <div className="bg-zinc-950/60 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-4 text-xs font-sans">
                <Compass className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-white">Friends Network Stream Empty</p>
                  <p className="text-zinc-500 leading-relaxed font-medium">
                    Follow other cinephiles (like @romils or @clara_o) on their profiles to sync their watches, reviews, and ratings in real time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {activityFeed.map((act) => (
                  <div 
                    key={act.id} 
                    className="p-4 bg-zinc-950 border border-white/5 rounded-3xl hover:border-white/10 transition flex items-start space-x-3 text-xs"
                  >
                    <img 
                      src={act.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      alt={act.username} 
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#F5C518]/20" 
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-center font-mono text-[9px] font-bold">
                        <span className="text-[#F5C518]">@{act.username}</span>
                        <span className="text-zinc-500">Just now</span>
                      </div>

                      {/* Content representation */}
                      {act.type === 'watched' && (
                        <p className="text-gray-300 font-sans font-medium">
                          Completed watching <span className="text-white font-bold">{act.movieTitle}</span>. Added to watch history log.
                        </p>
                      )}

                      {act.type === 'rated' && (
                        <p className="text-gray-300 font-sans font-medium">
                          Rated <span className="text-white font-bold">{act.movieTitle}</span> <span className="text-[#F5C518] font-bold">{act.rating}/5</span> stars.
                        </p>
                      )}

                      {act.type === 'reviewed' && (
                        <div className="space-y-1.5">
                          <p className="text-gray-300 font-sans font-medium">
                            Reviewed <span className="text-white font-bold">{act.movieTitle}</span>:
                          </p>
                          <div 
                            onClick={() => onMovieClick(act.movieId, false)}
                            className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl text-[11px] leading-relaxed italic text-zinc-400 line-clamp-2 hover:border-[#F5C518]/30 transition cursor-pointer"
                          >
                            "{act.reviewBody}"
                          </div>
                        </div>
                      )}

                      {/* Movie Quick Card backlink */}
                      <div 
                        onClick={() => onMovieClick(act.movieId, false)}
                        className="flex items-center gap-2 pt-1 font-mono text-[9px] text-[#F5C518] font-bold hover:underline cursor-pointer uppercase"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Inspect Media Specs</span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
