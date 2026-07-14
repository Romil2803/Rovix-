import React, { useState } from 'react';
import { Film, Star, Flame, Trophy, Share2, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Movie, WatchlistItem } from '../types';

interface YearlyWrappedWidgetProps {
  watchlist: WatchlistItem[];
  allMovies: Movie[];
  userDisplayName: string;
}

export default function YearlyWrappedWidget({ watchlist, allMovies, userDisplayName }: YearlyWrappedWidgetProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isShared, setIsShared] = useState(false);

  // Compute metrics based on completed items in watchlist
  const completedItems = watchlist.filter(w => w.status === 'Completed');
  const watchedMovies = completedItems.filter(w => !w.isTvShow).map(w => allMovies.find(m => m.id === w.movieId)).filter(Boolean) as Movie[];
  const watchedShows = completedItems.filter(w => w.isTvShow).map(w => allMovies.find(m => m.id === w.movieId)).filter(Boolean) as Movie[];
  const allWatchedMedia = [...watchedMovies, ...watchedShows];

  const hasData = completedItems.length > 0;

  // 1. Volumes
  const moviesCount = watchedMovies.length;
  const tvEpisodesCount = watchedShows.reduce((acc, curr) => acc + (curr.episodes || 10), 0);
  const totalMovieMinutes = watchedMovies.reduce((acc, curr) => acc + (curr.runtime || 120), 0);
  const totalTvMinutes = tvEpisodesCount * 45; // Approx 45 min per episode
  const hoursWatched = Math.round((totalMovieMinutes + totalTvMinutes) / 60);

  // 2. Favorite Genre
  const genres: Record<string, number> = {};
  allWatchedMedia.forEach(m => {
    if (m.genres && Array.isArray(m.genres)) {
      m.genres.forEach(g => {
        genres[g] = (genres[g] || 0) + 1;
      });
    }
  });
  const favoriteGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  // 3. Favorite Director
  const directors: Record<string, number> = {};
  watchedMovies.forEach(m => {
    if (m.director) {
      directors[m.director] = (directors[m.director] || 0) + 1;
    }
  });
  const favoriteDirector = Object.entries(directors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No Director Tracked';

  // 4. Favorite Actor
  const actors: Record<string, number> = {};
  allWatchedMedia.forEach(m => {
    if (m.cast && Array.isArray(m.cast)) {
      m.cast.slice(0, 3).forEach(c => {
        actors[c.name] = (actors[c.name] || 0) + 1;
      });
    }
  });
  const favoriteActor = Object.entries(actors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No Actor Tracked';

  // 5. Highest Rated Movie/TV experience
  const highestRated = allWatchedMedia.sort((a, b) => b.communityRating - a.communityRating)[0];

  // 6. Active Month calculation based on addedAt
  const monthCounts: Record<string, number> = {};
  completedItems.forEach(item => {
    if (item.addedAt) {
      const date = new Date(item.addedAt);
      if (!isNaN(date.getTime())) {
        const monthName = date.toLocaleString('default', { month: 'long' });
        monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
      }
    }
  });
  const activeMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // 7. Streak calculation: maximum consecutive calendar days items were marked as completed
  let maxStreak = 0;
  if (completedItems.length > 0) {
    const dates = completedItems
      .map(item => {
        if (!item.addedAt) return null;
        const d = new Date(item.addedAt);
        return !isNaN(d.getTime()) ? d.toDateString() : null;
      })
      .filter(Boolean) as string[];

    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d).getTime()).sort((a, b) => a - b);

    let currentStreak = 0;
    let prevTime: number | null = null;

    for (const time of uniqueDates) {
      if (prevTime === null) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((time - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
          currentStreak = 1;
        }
      }
      prevTime = time;
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }
  const watchStreak = maxStreak || 1;

  const slides = [
    {
      title: 'Your Year in Cinema',
      subtitle: `${new Date().getFullYear()} Cinematic Wrapped`,
      theme: 'from-amber-500 via-rose-500 to-indigo-600',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-6 pt-6">
          <p className="text-sm text-white/90 leading-relaxed font-sans max-w-lg mx-auto">
            Ready to explore your annual film metrics, <span className="font-black text-[#F5C518]">{userDisplayName}</span>? We've analyzed every single rating, status update, and logged review in your profile.
          </p>
          <div className="inline-block px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 font-bold uppercase tracking-wider text-xs font-mono text-[#F5C518]">
            🎬 Tap next to reveal your stats
          </div>
        </div>
      )
    },
    {
      title: 'The Cinematic Scale',
      subtitle: 'Your Watch Volume Statistics',
      theme: 'from-purple-600 via-violet-700 to-indigo-800',
      icon: Film,
      content: (
        <div className="grid grid-cols-2 gap-4 text-center py-6 font-mono">
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#F5C518] block">{moviesCount}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Movies Watched</span>
          </div>
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#F5C518] block">{watchedShows.length}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">TV Shows Tracked</span>
          </div>
          <div className="col-span-2 bg-black/30 border border-white/5 p-5 rounded-2xl">
            <span className="text-3xl font-black text-emerald-400 block">{hoursWatched}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Hours Logged in Seat</span>
          </div>
        </div>
      )
    },
    {
      title: 'Your Preferences',
      subtitle: 'Genres & Creative Teams',
      theme: 'from-pink-500 via-rose-600 to-amber-600',
      icon: Trophy,
      content: (
        <div className="space-y-3 py-4 text-xs font-sans">
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-2xl">
            <span className="text-gray-300">Favorite Genre</span>
            <span className="text-[#F5C518] font-bold text-sm bg-black/40 px-3 py-1 rounded-full">{favoriteGenre}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-2xl">
            <span className="text-gray-300">Preferred Director</span>
            <span className="text-white font-bold text-sm truncate max-w-[180px]" title={favoriteDirector}>{favoriteDirector}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-2xl">
            <span className="text-gray-300">Preferred Actor</span>
            <span className="text-white font-bold text-sm truncate max-w-[180px]" title={favoriteActor}>{favoriteActor}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Your Top Spotlight',
      subtitle: 'Highest Rated Logged Masterpiece',
      theme: 'from-emerald-600 via-teal-700 to-indigo-800',
      icon: Star,
      content: highestRated ? (
        <div className="flex items-center space-x-4 py-4 text-left">
          <img src={highestRated.posterUrl} alt={highestRated.title} className="w-20 h-28 object-cover rounded-2xl border border-white/10 shrink-0" />
          <div className="space-y-2 min-w-0">
            <h4 className="font-bold text-white text-md truncate leading-tight uppercase tracking-tight">{highestRated.title}</h4>
            <p className="text-[11px] text-zinc-300 line-clamp-3 leading-relaxed">"{highestRated.tagline || highestRated.overview}"</p>
            <div className="inline-flex items-center text-xs text-[#F5C518] font-mono font-bold bg-black/40 px-2.5 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-current mr-1" />
              <span>{highestRated.communityRating} / 5.0</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-zinc-400 text-xs italic">
          No rated titles found in your completed history.
        </div>
      )
    },
    {
      title: 'Your Cinematic Pulse',
      subtitle: 'Viewing Streaks & Active Seasons',
      theme: 'from-red-600 via-orange-600 to-yellow-600',
      icon: Flame,
      content: (
        <div className="grid grid-cols-2 gap-4 text-center py-6 font-mono">
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-orange-400 block">{watchStreak} {watchStreak === 1 ? 'Day' : 'Days'}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Longest Daily Streak</span>
          </div>
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#F5C518] block">{activeMonth}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Most Active Month</span>
          </div>
          <div className="col-span-2 bg-black/30 border border-white/5 px-4 py-3 rounded-2xl text-xs text-gray-300 font-sans flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#F5C518]" />
            <span>You are establishing an amazing cinematic legacy!</span>
          </div>
        </div>
      )
    }
  ];

  const handleShare = () => {
    setIsShared(true);
    // Write wrapped statistics to clipboard
    const summary = `🎬 ${userDisplayName}'s ${new Date().getFullYear()} Cinematic Wrapped on Rovix:\n` +
      `• Total watched titles: ${allWatchedMedia.length} (${moviesCount} Movies, ${watchedShows.length} Shows)\n` +
      `• Screen time: ${hoursWatched} hours\n` +
      `• Top Genre: ${favoriteGenre}\n` +
      `• Favorite Director: ${favoriteDirector}\n` +
      `• Longest log streak: ${watchStreak} days\n` +
      `Explore your own cinema stats on Rovix!`;
    navigator.clipboard.writeText(summary);
    setTimeout(() => setIsShared(false), 2500);
  };

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold font-sans text-white">Your Annual Wrapped Showcase</h3>
            <p className="text-xs text-gray-400 mt-1">A cinematic interactive breakdown of your annual watch history.</p>
          </div>
        </div>

        <div className="bg-[#111111]/60 border border-dashed border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#F5C518]/10 text-[#F5C518] rounded-full flex items-center justify-center mx-auto border border-[#F5C518]/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-sans font-black text-white uppercase tracking-tight">Your Wrapped is waiting!</h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Your annual movie milestone breakdown is empty. To assemble your dynamic slideshow, explore films or TV series and mark them as <span className="text-white font-bold">"Completed"</span> in your Watchlist.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-zinc-950 border border-white/5 px-4 py-2 rounded-xl text-zinc-500">
              ⚡ Status: 0 Titles Tracked
            </span>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = slides[currentSlide].icon;

  return (
    <div className="space-y-6">
      {/* Container header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold font-sans text-white">Your Annual Wrapped Showcase</h3>
          <p className="text-xs text-gray-400 mt-1">A cinematic interactive breakdown of your annual watch history.</p>
        </div>
        <button
          onClick={handleShare}
          className="px-4 py-2.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-[#F5C518]/10 cursor-pointer shrink-0"
        >
          {isShared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{isShared ? 'Wrapped Copied!' : 'Share Stats'}</span>
        </button>
      </div>

      {/* Slide Presentation Frame */}
      <div className={`relative w-full h-[360px] bg-gradient-to-br ${slides[currentSlide].theme} rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-8 transition-all duration-700`}>
        {/* Subtle animated overlay */}
        <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none" />

        {/* Slide Top Label */}
        <div className="flex justify-between items-start z-10">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 font-mono">
              {slides[currentSlide].subtitle}
            </span>
            <h4 className="text-2xl font-black text-white font-sans tracking-tight truncate">
              {slides[currentSlide].title}
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10 text-white shrink-0">
            <IconComponent className="w-5 h-5" />
          </div>
        </div>

        {/* Content Body Slot */}
        <div className="z-10 flex-1 flex flex-col justify-center">
          {slides[currentSlide].content}
        </div>

        {/* Slide Footer Controls */}
        <div className="flex justify-between items-center z-10 border-t border-white/10 pt-4">
          <div className="flex space-x-1">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className={`p-2 rounded-full border bg-black/20 hover:bg-black/40 text-white border-white/10 transition ${
                currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlide === slides.length - 1}
              className={`p-2 rounded-full border bg-black/20 hover:bg-black/40 text-white border-white/10 transition ${
                currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
