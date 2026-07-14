import React from 'react';
import { Award, Layers, BarChart2, Check, Clock, User, Film, Globe } from 'lucide-react';
import { Movie, WatchlistItem } from '../types';

interface MovieDNAWidgetProps {
  watchlist: WatchlistItem[];
  allMovies: Movie[];
  userFavoriteGenres: string[];
}

export default function MovieDNAWidget({ watchlist, allMovies, userFavoriteGenres }: MovieDNAWidgetProps) {
  // Extract user's interactive movies (either status 'Completed' or 'Favorites')
  const completedOrFavItems = watchlist.filter(w => w.status === 'Completed' || w.status === 'Favorites');
  const watchedMovies = completedOrFavItems
    .map(w => allMovies.find(m => m.id === w.movieId))
    .filter(Boolean) as Movie[];

  // 1. GENRE BREAKDOWN
  const genreCounts: Record<string, number> = {};
  // Seed with user's profile favorite genres so there's always something beautiful
  userFavoriteGenres.forEach(g => {
    genreCounts[g] = (genreCounts[g] || 0) + 1.5; // weight profile favorites slightly
  });
  watchedMovies.forEach(m => {
    m.genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalGenreWeight = sortedGenres.reduce((acc, curr) => acc + curr[1], 0) || 1;

  // 2. FAVORITE DIRECTORS / ACTORS
  const directorCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  let totalRuntime = 0;

  watchedMovies.forEach(m => {
    if (m.director) {
      directorCounts[m.director] = (directorCounts[m.director] || 0) + 1;
    }
    m.cast.slice(0, 3).forEach(c => {
      actorCounts[c.name] = (actorCounts[c.name] || 0) + 1;
    });
    if (m.country) {
      countryCounts[m.country] = (countryCounts[m.country] || 0) + 1;
    }
    if (m.releaseDate) {
      const year = parseInt(m.releaseDate.split('-')[0]);
      if (!isNaN(year)) {
        const decade = Math.floor(year / 10) * 10;
        decadeCounts[`${decade}s`] = (decadeCounts[`${decade}s`] || 0) + 1;
      }
    }
    totalRuntime += m.runtime || 120;
  });

  // Default values if empty
  const favoriteDirector = Object.entries(directorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Christopher Nolan';
  const favoriteActor = Object.entries(actorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Timothée Chalamet';
  const favoriteCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'United States';
  const favoriteDecade = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '2020s';
  const avgRuntime = watchedMovies.length > 0 ? Math.round(totalRuntime / watchedMovies.length) : 138;

  // 3. GENERATE CINEMATIC DNA BADGES
  const generatedBadges = [
    {
      id: 'scifi',
      name: 'Sci-Fi Master',
      desc: 'Obsessed with the future, space travel, and technology.',
      unlocked: sortedGenres.some(([g]) => g === 'Sci-Fi') || userFavoriteGenres.includes('Sci-Fi'),
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'thriller',
      name: 'Thriller Expert',
      desc: 'Can handle high-tension plotting and dark mysteries.',
      unlocked: sortedGenres.some(([g]) => g === 'Thriller') || userFavoriteGenres.includes('Thriller'),
      color: 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30'
    },
    {
      id: 'animation',
      name: 'Animation Lover',
      desc: 'Appreciates complex hand-drawn and digital visual arts.',
      unlocked: sortedGenres.some(([g]) => g === 'Animation') || userFavoriteGenres.includes('Animation'),
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'drama',
      name: 'Classic Collector',
      desc: 'Appreciates high-stakes human emotional narratives.',
      unlocked: sortedGenres.some(([g]) => g === 'Drama') || userFavoriteGenres.includes('Drama'),
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'horror',
      name: 'Nightmare Binger',
      desc: 'Enjoys pure psychological dread and suspense.',
      unlocked: sortedGenres.some(([g]) => g === 'Horror') || userFavoriteGenres.includes('Horror'),
      color: 'from-rose-950 to-red-950 text-rose-400 border-rose-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Visual Analytics Title */}
      <div>
        <h3 className="text-xl font-bold font-sans text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-[#FFD700]" />
          <span>Interactive Movie DNA™ Analyzer</span>
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          A real-time visual mapping of your cinematic tastes, genres of choice, and directing specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Box: SVG Genre Breakdown & Preferences */}
        <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-5 backdrop-blur-md">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-mono">
            <BarChart2 className="w-4 h-4 text-[#FFD700]" />
            <span>Genre Breakdown Mapping</span>
          </h4>

          {/* SVG/HTML Progress Bar Breakdown */}
          <div className="space-y-3.5">
            {sortedGenres.map(([genre, weight]) => {
              const percentage = Math.round((weight / totalGenreWeight) * 100);
              return (
                <div key={genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">{genre}</span>
                    <span className="text-gray-400 font-mono font-bold">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-[#FFD700] rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
            <div className="space-y-0.5">
              <span className="text-gray-500 font-mono block">AVERAGE RUNTIME</span>
              <span className="text-white font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {avgRuntime} min
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-gray-500 font-mono block">FAVORITE DECADE</span>
              <span className="text-white font-bold flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                {favoriteDecade}
              </span>
            </div>
          </div>
        </div>

        {/* Right Box: DNA Attributes & Badges */}
        <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-6 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-mono">
              <Globe className="w-4 h-4 text-[#FFD700]" />
              <span>Creative Preferences</span>
            </h4>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Preferred Director
                </span>
                <span className="text-white font-bold">{favoriteDirector}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Preferred Lead Actor
                </span>
                <span className="text-white font-bold">{favoriteActor}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Favorite Country
                </span>
                <span className="text-white font-bold">{favoriteCountry}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block font-mono">
              ACTIVE MOVIE DNA BADGES
            </span>
            <div className="flex flex-wrap gap-1.5">
              {generatedBadges.map(badge => (
                <span
                  key={badge.id}
                  className={`px-3 py-1 border text-[10px] font-bold rounded-full bg-gradient-to-r ${
                    badge.unlocked
                      ? badge.color
                      : 'from-zinc-900 to-zinc-950 text-gray-600 border-white/5 opacity-50'
                  }`}
                  title={badge.desc}
                >
                  {badge.name}
                  {badge.unlocked && <span className="ml-1 text-[8px]">✓</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
