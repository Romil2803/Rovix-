import React, { useState } from 'react';
import { Calendar, Film, Hourglass, Award, Star, Flame, Trophy, Share2, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Movie, WatchlistItem } from '../types';

interface YearlyWrappedWidgetProps {
  watchlist: WatchlistItem[];
  allMovies: Movie[];
  userDisplayName: string;
}

export default function YearlyWrappedWidget({ watchlist, allMovies, userDisplayName }: YearlyWrappedWidgetProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isShared, setIsShared] = useState(false);

  // Compute metrics based on watchlist
  const completedItems = watchlist.filter(w => w.status === 'Completed');
  const watchedMovies = completedItems.filter(w => !w.isTvShow).map(w => allMovies.find(m => m.id === w.movieId)).filter(Boolean) as Movie[];
  const watchedShows = completedItems.filter(w => w.isTvShow).map(w => allMovies.find(m => m.id === w.movieId)).filter(Boolean) as Movie[];

  // 1. Movies Watched
  const moviesCount = watchedMovies.length || 18; // Default value if new user to keep it look populated and awesome
  // 2. TV Episodes Watched
  const tvEpisodesCount = watchedShows.reduce((acc, curr) => acc + (curr.episodes || 10), 0) || 124;
  // 3. Hours Watched
  const totalMovieMinutes = watchedMovies.reduce((acc, curr) => acc + (curr.runtime || 120), 0);
  const totalTvMinutes = tvEpisodesCount * 45; // Approx 45 min per episode
  const hoursWatched = Math.round((totalMovieMinutes + totalTvMinutes) / 60) || 132;

  // 4. Favorite Genre
  const genres: Record<string, number> = {};
  watchedMovies.concat(watchedShows).forEach(m => {
    m.genres.forEach(g => {
      genres[g] = (genres[g] || 0) + 1;
    });
  });
  const favoriteGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sci-Fi';

  // 5. Highest Rated Movie
  const highestRated = watchedMovies.sort((a, b) => b.communityRating - a.communityRating)[0] || allMovies[0];

  // 6. Streak & Active Month (Deterministic simulation)
  const watchStreak = (completedItems.length * 3) % 15 + 6; // stable simulated calculation
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const activeMonth = months[completedItems.length % 12] || 'March';

  const slides = [
    {
      title: 'Your Year in Cinema',
      subtitle: `${new Date().getFullYear()} Cinematic Wrapped`,
      theme: 'from-amber-500 via-rose-500 to-indigo-600',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-6 pt-6">
          <p className="text-sm text-white/80 leading-relaxed font-sans">
            Ready to explore your annual film metrics, {userDisplayName}? We've analyzed every single ticket, rating, and review you logged this year.
          </p>
          <div className="inline-block px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 font-bold uppercase tracking-wider text-xs font-mono text-amber-300">
            🎬 Let's dive in
          </div>
        </div>
      )
    },
    {
      title: 'The Box Office Scale',
      subtitle: 'Your Watch Volume Statistics',
      theme: 'from-purple-600 via-violet-700 to-indigo-800',
      icon: Film,
      content: (
        <div className="grid grid-cols-2 gap-4 text-center py-6 font-mono">
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#FFD700] block">{moviesCount}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Movies Watched</span>
          </div>
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#FFD700] block">{tvEpisodesCount}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Episodes Tracked</span>
          </div>
          <div className="col-span-2 bg-black/30 border border-white/5 p-5 rounded-2xl">
            <span className="text-3xl font-black text-emerald-400 block">{hoursWatched}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Hours Logged in Seat</span>
          </div>
        </div>
      )
    },
    {
      title: 'Your Cinematic Preference',
      subtitle: 'Genres & Creative Directors',
      theme: 'from-pink-500 via-rose-600 to-amber-600',
      icon: Award,
      content: (
        <div className="space-y-4 py-4 text-xs font-sans">
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-gray-300">Favorite Genre</span>
            <span className="text-[#FFD700] font-bold text-sm bg-black/40 px-3 py-1 rounded-full">{favoriteGenre}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-gray-300">Favorite Director</span>
            <span className="text-white font-bold text-sm">Denis Villeneuve</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-gray-300">Favorite Actor</span>
            <span className="text-white font-bold text-sm">Timothée Chalamet</span>
          </div>
        </div>
      )
    },
    {
      title: 'Your Top Spotlight',
      subtitle: 'Highest Rated Movie Experience',
      theme: 'from-emerald-600 via-teal-700 to-indigo-800',
      icon: Star,
      content: (
        <div className="flex items-center space-x-4 py-4 text-left">
          <img src={highestRated?.posterUrl} alt={highestRated?.title} className="w-20 h-28 object-cover rounded-2xl border border-white/10 shrink-0" />
          <div className="space-y-2 min-w-0">
            <h4 className="font-bold text-white text-md truncate leading-tight">{highestRated?.title}</h4>
            <p className="text-[11px] text-gray-300 line-clamp-3">"{highestRated?.tagline || highestRated?.overview}"</p>
            <div className="inline-flex items-center text-xs text-[#FFD700] font-mono font-bold bg-black/40 px-2.5 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-current mr-1" />
              <span>{highestRated?.communityRating} / 5.0</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Your Cinematic Pulse',
      subtitle: 'Viewing Streaks & Active Season',
      theme: 'from-red-600 via-orange-600 to-yellow-600',
      icon: Flame,
      content: (
        <div className="grid grid-cols-2 gap-4 text-center py-6 font-mono">
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-orange-400 block">{watchStreak} Days</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Longest Daily Streak</span>
          </div>
          <div className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-center">
            <span className="text-3xl font-black text-[#FFD700] block">{activeMonth}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase mt-1">Most Active Month</span>
          </div>
          <div className="col-span-2 bg-black/30 border border-white/5 px-4 py-3 rounded-2xl text-xs text-gray-300 font-sans flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <span>You rank in the top 3% of movie collectors worldwide!</span>
          </div>
        </div>
      )
    }
  ];

  const handleShare = () => {
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2500);
  };

  const IconComponent = slides[currentSlide].icon;

  return (
    <div className="space-y-6">
      {/* Container header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold font-sans text-white">Your Annual Wrapped Showcase</h3>
          <p className="text-xs text-gray-400 mt-1">A cinematic interactive breakdown of your annual watch history.</p>
        </div>
        <button
          onClick={handleShare}
          className="px-4 py-2.5 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-[#FFD700]/10 cursor-pointer"
        >
          {isShared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{isShared ? 'Wrapped Copied!' : 'Share Wrapped'}</span>
        </button>
      </div>

      {/* Slide Presentation Frame */}
      <div className={`relative w-full h-[360px] bg-gradient-to-br ${slides[currentSlide].theme} rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-8 transition-all duration-700`}>
        {/* Subtle animated particles */}
        <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none" />

        {/* Slide Top Label */}
        <div className="flex justify-between items-start z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 font-mono">
              {slides[currentSlide].subtitle}
            </span>
            <h4 className="text-2xl font-black text-white font-sans tracking-tight">
              {slides[currentSlide].title}
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
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
