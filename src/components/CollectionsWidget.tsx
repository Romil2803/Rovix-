import React, { useState } from 'react';
import { 
  Layers, Heart, Bookmark, MessageSquare, ChevronRight, Check, 
  Plus, Star, Shield, Lock, Unlock, Eye, Sparkles, X, Image as ImageIcon 
} from 'lucide-react';
import { Movie } from '../types';
import { 
  getCollections, createCollection, likeCollection, 
  followCollection, addCollectionComment, awardXP 
} from '../db/storage';

interface CollectionsWidgetProps {
  allMovies: Movie[];
  userId: string;
  username: string;
  onMovieClick: (id: string, isTv: boolean) => void;
}

const COVER_PRESETS = [
  { name: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800' },
  { name: 'Classic Hollywood', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800' },
  { name: 'Spooky Gothic', url: 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?w=800' },
  { name: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800' },
  { name: 'Cinema Hall', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800' }
];

export default function CollectionsWidget({ allMovies, userId, username, onMovieClick }: CollectionsWidgetProps) {
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Create Playlist Panel Toggle
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState(COVER_PRESETS[0].url);
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);

  // Experience Notification Toast
  const [xpToast, setXpToast] = useState<string | null>(null);

  const showXpToast = (message: string) => {
    setXpToast(message);
    setTimeout(() => setXpToast(null), 3000);
  };

  const handleLikeCollectionClick = async (colId: string) => {
    await likeCollection(colId, userId);
    showXpToast('+5 XP Earned! Liked Playlist! ❤️');
  };

  const handleFollowCollectionClick = async (colId: string) => {
    await followCollection(colId, userId);
    showXpToast('Playlist Added to Watch Later! 🔖');
  };

  const handleAddCommentSubmit = async (e: React.FormEvent, colId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await addCollectionComment(colId, username, commentText);
    setCommentText('');
    showXpToast('+10 XP Earned! Comment Shared! 💬');
  };

  const handleToggleMovieSelection = (movieId: string) => {
    if (selectedMovieIds.includes(movieId)) {
      setSelectedMovieIds(selectedMovieIds.filter(id => id !== movieId));
    } else {
      setSelectedMovieIds([...selectedMovieIds, movieId]);
    }
  };

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    if (selectedMovieIds.length === 0) {
      alert('Please select at least 1 movie/show to include in your collection!');
      return;
    }

    await createCollection(userId, username, newTitle, newDesc, newCover, selectedMovieIds, isPrivate);

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewCover(COVER_PRESETS[0].url);
    setSelectedMovieIds([]);
    setIsPrivate(false);
    setShowCreatePanel(false);

    showXpToast('+40 XP Earned! Smart Playlist Created! 🌟');
  };

  // Get collections from Firestore
  const allCollections = getCollections();
  
  // Filter collections: public ones OR private ones created by the logged-in user
  const visibleCollections = allCollections.filter(col => {
    if (!col.isPrivate) return true;
    return col.creatorId === userId || col.creator === username;
  });

  const activeCol = visibleCollections.find(c => c.id === selectedColId);

  return (
    <div className="space-y-6">
      {/* XP Toast Notification */}
      {xpToast && (
        <div className="fixed top-24 right-6 bg-[#F5C518] text-black px-5 py-3 rounded-2xl font-black shadow-2xl z-50 animate-bounce flex items-center space-x-2 border border-white/10 text-xs">
          <span>{xpToast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sans tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#F5C518]" />
            <span>SMART CINEMA COLLECTIONS</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Browse creative movie marathons, chronological timelines, and theme checklists curated in real time.
          </p>
        </div>
        
        <div className="flex gap-2">
          {!selectedColId && !showCreatePanel && (
            <button
              onClick={() => setShowCreatePanel(true)}
              className="px-4 py-2 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> CREATE PLAYLIST
            </button>
          )}

          {(selectedColId || showCreatePanel) && (
            <button
              onClick={() => {
                setSelectedColId(null);
                setShowCreatePanel(false);
              }}
              className="px-4 py-2 bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-mono font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ← BACK TO LOBBY
            </button>
          )}
        </div>
      </div>

      {!selectedColId && !showCreatePanel ? (
        /* Grid list of curated collections */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleCollections.map(col => {
            const hasLiked = col.likedBy?.includes(userId) || false;
            const hasFollowed = col.followedBy?.includes(userId) || false;

            return (
              <div
                key={col.id}
                className="group relative h-[250px] bg-zinc-950/80 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl hover:border-[#F5C518]/30 transition-all duration-300 flex flex-col justify-end p-6 cursor-pointer"
                onClick={() => setSelectedColId(col.id)}
              >
                {/* Backdrop Image overlay */}
                <div className="absolute inset-0 z-0">
                  <img src={col.backdrop} alt={col.title} className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-black/30" />
                </div>

                {/* Content Box */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#F5C518] font-mono">
                      Curated by @{col.creator}
                    </span>
                    {col.isPrivate && (
                      <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[8px] font-mono font-black flex items-center gap-0.5 uppercase">
                        <Lock className="w-2.5 h-2.5" /> Secret List
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black font-sans text-white group-hover:text-[#F5C518] transition">
                    {col.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-sans font-medium h-8">
                    {col.desc}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3 text-[10px] font-mono text-gray-400">
                    <div className="flex space-x-3">
                      <span className="flex items-center gap-1 font-bold">
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-500 text-red-500' : 'text-[#F5C518]'}`} />
                        {col.likes || 0} Likes
                      </span>
                      <span className="flex items-center gap-1 font-bold">
                        <Bookmark className={`w-3.5 h-3.5 ${hasFollowed ? 'fill-[#F5C518] text-[#F5C518]' : ''}`} />
                        {col.followers || 0} Followers
                      </span>
                    </div>
                    <span className="flex items-center text-[#F5C518] font-black uppercase tracking-widest text-[9px]">
                      OPEN <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : showCreatePanel ? (
        /* Create Collection Panel UI */
        <div className="max-w-2xl mx-auto bg-zinc-950/80 border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white font-sans flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-[#F5C518]" /> CREATE CUSTOM MOVIE PLAYLIST
            </h3>
            <p className="text-[11px] text-gray-400 font-mono">Design creative marathons, timelines, or aesthetic cinema logs.</p>
          </div>

          <form onSubmit={handleCreateCollectionSubmit} className="space-y-5 text-xs">
            {/* Title & Desc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Playlist Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Nolan Cinematic Puzzle, Absolute Cozy Ghibli"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#F5C518] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Privacy Toggle</label>
                <div className="flex gap-2 h-[38px]">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition font-mono uppercase text-[9px] ${
                      !isPrivate
                        ? 'bg-[#F5C518] text-black border-[#F5C518]'
                        : 'bg-zinc-900 border-white/5 text-gray-400'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" /> Public Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition font-mono uppercase text-[9px] ${
                      isPrivate
                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/15'
                        : 'bg-zinc-900 border-white/5 text-gray-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Private Secret
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Description / Tagline</label>
              <textarea
                required
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Briefly state the theme, chronological specifications, or cinematic intent behind this list..."
                rows={2}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#F5C518] outline-none resize-none"
              />
            </div>

            {/* Cover Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#F5C518]" /> Cover Image Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {COVER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewCover(preset.url)}
                    className={`relative h-16 rounded-xl overflow-hidden border transition text-[10px] font-bold ${
                      newCover === preset.url ? 'border-[#F5C518] ring-1 ring-[#F5C518]/30' : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-1 text-white">
                      <span>{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Movie Multi Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">
                Include Movies & Shows ({selectedMovieIds.length} Selected)
              </label>
              <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 max-h-[160px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allMovies.map(movie => {
                  const isChecked = selectedMovieIds.includes(movie.id);
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => handleToggleMovieSelection(movie.id)}
                      className={`flex items-center space-x-3 p-2 rounded-xl text-left border transition ${
                        isChecked
                          ? 'bg-[#F5C518]/5 border-[#F5C518]/30'
                          : 'bg-zinc-900/60 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <img src={movie.posterUrl} alt={movie.title} className="w-7 h-10 object-cover rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[11px] text-white truncate">{movie.title}</p>
                        <p className="text-[9px] text-gray-500 font-mono">{movie.genres[0]} • {movie.isTvShow ? 'TV' : 'Movie'}</p>
                      </div>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border text-[9px] font-bold ${
                        isChecked ? 'bg-[#F5C518] border-[#F5C518] text-black' : 'border-white/10 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-[#F5C518]/15 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> BROADCAST PLAYLIST
            </button>
          </form>
        </div>
      ) : (
        /* Detailed collection page */
        activeCol && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Playlist Movies */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative h-[200px] rounded-[2rem] overflow-hidden border border-white/10 flex flex-col justify-end p-6 md:p-8">
                <img src={activeCol.backdrop} alt={activeCol.title} className="absolute inset-0 w-full h-full object-cover opacity-30 animate-fadeIn" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-black/40 z-0" />
                
                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                      CURATED PLAYLIST • CURATED BY @{activeCol.creator}
                    </span>
                    {activeCol.isPrivate && (
                      <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> SECRET
                      </span>
                    )}
                  </div>
                  <h4 className="text-2xl font-black text-white font-sans">{activeCol.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-xl font-medium">{activeCol.desc}</p>
                </div>
              </div>

              {/* Films listed */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 font-mono">Movies Included ({activeCol.movieIds?.length || 0})</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCol.movieIds?.map((mid: string) => {
                    const movie = allMovies.find(m => m.id === mid);
                    if (!movie) return null;

                    return (
                      <div
                        key={movie.id}
                        onClick={() => onMovieClick(movie.id, !!movie.isTvShow)}
                        className="bg-zinc-950 border border-white/5 hover:border-[#F5C518]/30 p-3.5 rounded-2.5xl flex items-center space-x-4 cursor-pointer transition duration-300 group"
                      >
                        <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded-xl shrink-0 border border-white/5" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-white truncate group-hover:text-[#F5C518] transition">{movie.title}</p>
                          <div className="flex items-center text-[10px] text-[#F5C518] font-mono mt-1 font-semibold">
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
              <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                <h5 className="font-bold text-xs uppercase tracking-widest text-zinc-500 font-mono">PLAYLIST SPECIFICATIONS</h5>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleLikeCollectionClick(activeCol.id)}
                    className={`py-3.5 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer font-mono text-[10px] uppercase ${
                      activeCol.likedBy?.includes(userId)
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-500/10'
                        : 'bg-zinc-900 border-white/10 text-gray-300 hover:border-white/15'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{activeCol.likedBy?.includes(userId) ? 'Liked' : 'Like'} ({activeCol.likes || 0})</span>
                  </button>

                  <button
                    onClick={() => handleFollowCollectionClick(activeCol.id)}
                    className={`py-3.5 rounded-xl border flex items-center justify-center space-x-1.5 font-bold transition cursor-pointer font-mono text-[10px] uppercase ${
                      activeCol.followedBy?.includes(userId)
                        ? 'bg-[#F5C518] text-black border-[#F5C518] shadow-lg shadow-[#F5C518]/10'
                        : 'bg-zinc-900 border-white/10 text-gray-300 hover:border-white/15'
                    }`}
                  >
                    {activeCol.followedBy?.includes(userId) ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span>{activeCol.followedBy?.includes(userId) ? 'Watch Later' : 'Watch Later'} ({activeCol.followers || 0})</span>
                  </button>
                </div>
              </div>

              {/* Comments Feed */}
              <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Comments ({activeCol.comments?.length || 0})
                  </h5>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {!activeCol.comments || activeCol.comments.length === 0 ? (
                      <p className="text-center py-6 text-zinc-600 text-[10px] italic font-mono font-bold uppercase">
                        No Comments on this list.
                      </p>
                    ) : (
                      activeCol.comments.map((comm: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950 border border-white/5 p-3.5 rounded-2xl text-xs space-y-1">
                          <div className="flex justify-between font-bold text-[#F5C518] text-[9px] font-mono">
                            <span>@{comm.author}</span>
                            <span className="text-gray-500 font-normal">{comm.date}</span>
                          </div>
                          <p className="text-gray-300 font-sans leading-relaxed break-words">{comm.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form onSubmit={(e) => handleAddCommentSubmit(e, activeCol.id)} className="space-y-2.5 pt-3.5 border-t border-white/5 mt-4">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a supportive comment..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F5C518] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
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
