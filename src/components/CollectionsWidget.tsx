import React, { useState, useEffect } from 'react';
import { Layers, Heart, Bookmark, MessageSquare, ChevronRight, Check, Plus, Star } from 'lucide-react';
import { Movie } from '../types';

interface CollectionsWidgetProps {
  allMovies: Movie[];
  userId: string;
  username: string;
  onMovieClick: (id: string, isTv: boolean) => void;
}

interface Collection {
  id: string;
  title: string;
  desc: string;
  creator: string;
  backdrop: string;
  movieIds: string[];
  likes: number;
  likedBy: string[];
  followers: number;
  followedBy: string[];
  comments: { author: string; body: string; date: string }[];
}

export default function CollectionsWidget({ allMovies, userId, username, onMovieClick }: CollectionsWidgetProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const COLLECTIONS_KEY = 'rovix_collections_data';

  useEffect(() => {
    const cached = localStorage.getItem(COLLECTIONS_KEY);
    if (cached) {
      setCollections(JSON.parse(cached));
    } else {
      // Seed default highly detailed movie collections
      const defaults: Collection[] = [
        {
          id: 'col_marvel',
          title: 'Marvel Cinematic Timeline',
          desc: 'The complete cinematic narrative order for the Earth-616 saga, from Iron Man to Avengers: Endgame.',
          creator: 'clara_o',
          backdrop: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?w=800',
          movieIds: ['1', '5'], // Interstellar, Oppenheimer etc mapping
          likes: 124,
          likedBy: [],
          followers: 89,
          followedBy: [],
          comments: [
            { author: 'romils', body: 'The absolute greatest universe of films ever stitched together. Brilliant.', date: '1 day ago' }
          ]
        },
        {
          id: 'col_scifi',
          title: 'Best Sci-Fi & Cosmic Travel',
          desc: 'Warp-speed astrophysics, black holes, AI synthetic entities, and planetary exploration masterclasses.',
          creator: 'romils',
          backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
          movieIds: ['1', '2'], // Interstellar, Dune
          likes: 245,
          likedBy: [],
          followers: 172,
          followedBy: [],
          comments: [
            { author: 'cooper_n', body: 'Interstellar belongs on the peak pedestal of human creative achievement.', date: '3 days ago' }
          ]
        },
        {
          id: 'col_comfort',
          title: 'Comfort Movies & Warm Aesthetic',
          desc: 'Beautiful cinematography, nostalgic soundscapes, and heart-melting character narratives.',
          creator: 'cooper_n',
          backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
          movieIds: ['3', '4'], // Spirited Away, Spider-Man
          likes: 92,
          likedBy: [],
          followers: 43,
          followedBy: [],
          comments: [
            { author: 'clara_o', body: 'Perfect cozy lists for a rainy Sunday evening with warm coffee!', date: '5 hours ago' }
          ]
        },
        {
          id: 'col_oscars',
          title: 'Oscar Winners & High Drama',
          desc: 'Films awarded the prestigious Best Picture Academy Award, celebrated for exceptional screenplay and acting scale.',
          creator: 'admin',
          backdrop: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800',
          movieIds: ['5', '6'], // Oppenheimer, Everything Everywhere
          likes: 310,
          likedBy: [],
          followers: 215,
          followedBy: [],
          comments: [
            { author: 'romils', body: 'Oppenheimer absolutely deserved every single golden statuette. What a masterpiece.', date: 'Yesterday' }
          ]
        }
      ];
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(defaults));
      setCollections(defaults);
    }
  }, []);

  const handleLikeCollection = (colId: string) => {
    const updated = collections.map(c => {
      if (c.id !== colId) return c;
      const alreadyLiked = c.likedBy.includes(userId);
      const likedBy = alreadyLiked ? c.likedBy.filter(id => id !== userId) : [...c.likedBy, userId];
      const likes = alreadyLiked ? c.likes - 1 : c.likes + 1;
      return { ...c, likes, likedBy };
    });
    setCollections(updated);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  };

  const handleFollowCollection = (colId: string) => {
    const updated = collections.map(c => {
      if (c.id !== colId) return c;
      const alreadyFollowed = c.followedBy.includes(userId);
      const followedBy = alreadyFollowed ? c.followedBy.filter(id => id !== userId) : [...c.followedBy, userId];
      const followers = alreadyFollowed ? c.followers - 1 : c.followers + 1;
      return { ...c, followers, followedBy };
    });
    setCollections(updated);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  };

  const handleAddComment = (e: React.FormEvent, colId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const updated = collections.map(c => {
      if (c.id !== colId) return c;
      const comment = {
        author: username,
        body: commentText,
        date: 'Just now'
      };
      return { ...c, comments: [...c.comments, comment] };
    });
    setCollections(updated);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    setCommentText('');
  };

  const activeCol = collections.find(c => c.id === selectedColId);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white font-sans tracking-tight">Curated Movie Collections</h3>
          <p className="text-xs text-gray-400 mt-1">
            Browse creative movie marathons, timelines, and catalogs created by the Rovix cinephile community.
          </p>
        </div>
        {selectedColId && (
          <button
            onClick={() => setSelectedColId(null)}
            className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            ← Back to Collections
          </button>
        )}
      </div>

      {!selectedColId ? (
        /* Grid list of curated collections */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map(col => {
            const hasLiked = col.likedBy.includes(userId);
            const hasFollowed = col.followedBy.includes(userId);

            return (
              <div
                key={col.id}
                className="group relative h-[240px] bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl hover:border-amber-400/30 transition-all duration-300 flex flex-col justify-end p-6 cursor-pointer"
                onClick={() => setSelectedColId(col.id)}
              >
                {/* Backdrop Image overlay */}
                <div className="absolute inset-0 z-0">
                  <img src={col.backdrop} alt={col.title} className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/30" />
                </div>

                {/* Content Box */}
                <div className="relative z-10 space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFD700] font-mono">
                    Curated by @{col.creator}
                  </span>
                  <h4 className="text-xl font-bold font-sans text-white group-hover:text-amber-400 transition">
                    {col.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {col.desc}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 text-[10px] font-mono text-gray-400">
                    <div className="flex space-x-3">
                      <span className="flex items-center gap-1">
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        {col.likes} Likes
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className={`w-3.5 h-3.5 ${hasFollowed ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {col.followers} Followers
                      </span>
                    </div>
                    <span className="flex items-center text-amber-400 font-bold">
                      View Collection <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed collection page */
        activeCol && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Playlist Movies */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative h-[200px] rounded-[2rem] overflow-hidden border border-white/10 flex flex-col justify-end p-6">
                <img src={activeCol.backdrop} alt={activeCol.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/40 z-0" />
                
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">CURATED PLAYLIST • BY @{activeCol.creator}</span>
                  <h4 className="text-2xl font-black text-white font-sans">{activeCol.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-xl">{activeCol.desc}</p>
                </div>
              </div>

              {/* Films listed */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 font-mono">Movies Included ({activeCol.movieIds.length})</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCol.movieIds.map(mid => {
                    const movie = allMovies.find(m => m.id === mid);
                    if (!movie) return null;

                    return (
                      <div
                        key={movie.id}
                        onClick={() => onMovieClick(movie.id, !!movie.isTvShow)}
                        className="bg-zinc-900/40 border border-white/5 hover:border-white/15 p-3 rounded-2xl flex items-center space-x-4 cursor-pointer transition duration-300"
                      >
                        <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded-lg shrink-0 border border-white/5" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate">{movie.title}</p>
                          <div className="flex items-center text-[10px] text-[#FFD700] font-mono mt-0.5">
                            <Star className="w-3 h-3 fill-current mr-1" />
                            <span>{movie.communityRating} • {movie.genres[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Interaction Hub, Like, Follow, Comments */}
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                <h5 className="font-bold text-sm text-white font-sans">Interact with Playlist</h5>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLikeCollection(activeCol.id)}
                    className={`py-3 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer ${
                      activeCol.likedBy.includes(userId)
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-500/10'
                        : 'bg-zinc-950 border-white/5 text-gray-300 hover:border-white/15'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{activeCol.likedBy.includes(userId) ? 'Liked' : 'Like'} ({activeCol.likes})</span>
                  </button>

                  <button
                    onClick={() => handleFollowCollection(activeCol.id)}
                    className={`py-3 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer ${
                      activeCol.followedBy.includes(userId)
                        ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/10'
                        : 'bg-zinc-950 border-white/5 text-gray-300 hover:border-white/15'
                    }`}
                  >
                    {activeCol.followedBy.includes(userId) ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span>{activeCol.followedBy.includes(userId) ? 'Following' : 'Follow'} ({activeCol.followers})</span>
                  </button>
                </div>
              </div>

              {/* Comments Feed */}
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 font-mono flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Comments ({activeCol.comments.length})
                  </h5>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {activeCol.comments.map((comm, idx) => (
                      <div key={idx} className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl text-xs space-y-0.5">
                        <div className="flex justify-between font-bold text-amber-400 text-[10px]">
                          <span>@{comm.author}</span>
                          <span className="text-gray-500 font-normal">{comm.date}</span>
                        </div>
                        <p className="text-gray-300 font-sans leading-relaxed">{comm.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e) => handleAddComment(e, activeCol.id)} className="space-y-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a supportive comment..."
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Post Comment
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
