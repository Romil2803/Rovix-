import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Bookmark,
  MessageSquare,
  Users,
  Award,
  Globe,
  Lock,
  LogOut,
  Trash2,
  Edit2,
  Calendar,
  Save,
  Tv,
  Film,
  Key,
  X,
  Sparkles,
  Upload
} from 'lucide-react';
import {
  getCurrentUser,
  updateProfile,
  deleteAccount,
  getFollowers,
  getFollowing,
  getReviews,
  getWatchlist,
  getTMDBKey,
  setTMDBKey
} from '../db/storage';
import { User as UserType, Review, WatchlistItem, Movie } from '../types';
import MovieDNAWidget from './MovieDNAWidget';
import YearlyWrappedWidget from './YearlyWrappedWidget';

interface ProfileTabProps {
  onLogout: () => void;
  onMovieClick: (id: string, isTv: boolean) => void;
  allMovies: Movie[];
}

export default function ProfileTab({ onLogout, onMovieClick, allMovies }: ProfileTabProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'activity' | 'favorites' | 'dna' | 'settings'>('activity');

  // Network Modals
  const [showNetworkModal, setShowNetworkModal] = useState<'followers' | 'following' | null>(null);
  const [networkUsers, setNetworkUsers] = useState<UserType[]>([]);

  // Statistics
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [favGenres, setFavGenres] = useState<string[]>([]);

  // Settings states
  const [language, setLanguage] = useState('English');
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifFollowers, setNotifFollowers] = useState(true);
  const [notifLikes, setNotifLikes] = useState(true);
  const [tmdbKey, setTmdbKey] = useState('');

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const loadProfileData = () => {
    const cur = getCurrentUser();
    if (cur) {
      setUser(cur);
      setDisplayName(cur.displayName);
      setBio(cur.bio);
      setAvatarUrl(cur.avatarUrl);
      setBannerUrl(cur.bannerUrl);
      setFavGenres(cur.favoriteGenres);

      // Load counts
      setWatchlist(getWatchlist(cur.id));
      setReviews(getReviews().filter(r => r.userId === cur.id));
      setTmdbKey(getTMDBKey());
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  if (!user) return null;

  // Save profile updates
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(user.id, {
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      favoriteGenres: favGenres
    });
    setIsEditing(false);
    loadProfileData();
    triggerAlert('Profile specifications saved!');
  };

  const handleGenreToggle = (g: string) => {
    if (favGenres.includes(g)) {
      setFavGenres(favGenres.filter(item => item !== g));
    } else {
      setFavGenres([...favGenres, g]);
    }
  };

  const triggerAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Open Network list (Followers/Following)
  const handleOpenNetwork = (type: 'followers' | 'following') => {
    if (type === 'followers') {
      setNetworkUsers(getFollowers(user.id));
    } else {
      setNetworkUsers(getFollowing(user.id));
    }
    setShowNetworkModal(type);
  };

  // Account Operations
  const handleDeleteMyAccount = () => {
    if (confirm('Are you absolutely sure you want to delete your Rovix account? This action is irreversible.')) {
      deleteAccount(user.id);
      onLogout();
    }
  };

  const handleSaveTMDBKey = () => {
    setTMDBKey(tmdbKey);
    triggerAlert('TMDb credentials updated successfully!');
  };

  // Badges data
  const badges = [
    { name: 'Founding Cinephile', desc: 'Joined during launch year', icon: Award, color: 'text-[#F5C518]' },
    { name: 'Word Critic', desc: 'Published 3+ detailed reviews', icon: MessageSquare, color: 'text-amber-400' },
    { name: 'Curator', desc: 'Added 5+ items to watchlist', icon: Bookmark, color: 'text-emerald-400' }
  ];

  // Favorite films grid
  const favoriteMovies = watchlist
    .filter(item => item.status === 'Favorites')
    .map(wlItem => allMovies.find(m => m.id === wlItem.movieId))
    .filter(Boolean) as Movie[];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-24 text-white min-h-screen">
      {/* Toast Alert */}
      {alertMsg && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 bg-[#F5C518] text-black px-6 py-4 rounded-2xl font-black shadow-2xl z-50 animate-bounce border border-white/10">
          {alertMsg}
        </div>
      )}

      {/* Profile Page Header Title */}
      <div className="mb-8 mt-2 animate-fadeIn">
        <h1 className="text-3xl font-sans font-black tracking-tight text-white uppercase flex items-center space-x-3">
          <User className="w-8 h-8 text-[#F5C518]" />
          <span>User Dashboard</span>
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm font-medium mt-1">
          Configure film lists, account settings, network stats, and cinematic milestones.
        </p>
      </div>

      {/* Profile Header banner */}
      <div className="relative h-48 md:h-80 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl mb-12">
        <img
          src={bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80'}
          alt="Banner"
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/40 to-transparent" />

        {/* Edit Button desktop floating */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-5 right-5 flex items-center space-x-2 px-5 py-2.5 bg-black/60 hover:bg-[#F5C518] hover:text-black border border-white/10 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 z-10 cursor-pointer hover:scale-105"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>

        {/* Profile Details Overlay */}
        <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#090909] overflow-hidden shadow-2xl">
              <img src={avatarUrl} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <div className="pb-2 space-y-1.5">
              <h1 className="text-2xl md:text-4xl font-sans font-black tracking-tight flex items-center justify-center md:justify-start space-x-2">
                <span>{user.displayName}</span>
                {user.isAdmin && <span className="text-[10px] bg-[#F5C518] text-black font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono shadow-md">Staff</span>}
              </h1>
              <p className="text-zinc-400 text-sm font-mono font-bold">@{user.username}</p>
              <p className="text-zinc-500 text-xs flex items-center justify-center md:justify-start font-mono font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#F5C518]" />
                <span>Joined {user.joinedDate}</span>
              </p>
            </div>
          </div>

          {/* Followers Stats */}
          <div className="flex justify-center space-x-6 text-center md:text-right pb-2 font-mono">
            <div className="cursor-pointer group" onClick={() => handleOpenNetwork('followers')}>
              <p className="text-2xl font-black group-hover:text-[#F5C518] transition-colors">{user.followersCount}</p>
              <p className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider">Followers</p>
            </div>
            <div className="cursor-pointer group" onClick={() => handleOpenNetwork('following')}>
              <p className="text-2xl font-black group-hover:text-[#F5C518] transition-colors">{user.followingCount}</p>
              <p className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats and tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Biography, Badges, Fav genres */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111111]/90 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-black text-xs uppercase tracking-wider text-zinc-500">Biography</h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">{user.bio || 'No bio written yet.'}</p>
          </div>

          {/* Stats blocks */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="bg-[#111111]/90 border border-white/5 p-4 rounded-2xl shadow-md">
              <Film className="w-4 h-4 mx-auto mb-1.5 text-[#F5C518]" />
              <p className="font-black text-lg text-white">{watchlist.filter(w => !w.isTvShow && w.status === 'Completed').length}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Movies</p>
            </div>
            <div className="bg-[#111111]/90 border border-white/5 p-4 rounded-2xl shadow-md">
              <Tv className="w-4 h-4 mx-auto mb-1.5 text-[#F5C518]" />
              <p className="font-black text-lg text-white">{watchlist.filter(w => w.isTvShow && w.status === 'Completed').length}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Shows</p>
            </div>
            <div className="bg-[#111111]/90 border border-white/5 p-4 rounded-2xl shadow-md">
              <MessageSquare className="w-4 h-4 mx-auto mb-1.5 text-[#F5C518]" />
              <p className="font-black text-lg text-white">{reviews.length}</p>
              <p className="text-[9px] text-zinc-500 uppercase font-sans font-bold">Reviews</p>
            </div>
          </div>

          {/* Badges system */}
          <div className="bg-[#111111]/90 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-black text-xs uppercase tracking-wider text-zinc-500">Cinematic Badges</h3>
            <div className="space-y-3">
              {badges.slice(0, reviews.length >= 3 ? 3 : watchlist.length >= 5 ? 2 : 1).map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="flex items-center space-x-3 bg-[#1A1A1A] p-3 rounded-2xl border border-white/5">
                    <Icon className={`w-5 h-5 ${b.color}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate">{b.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Favorite genres display */}
          {favGenres.length > 0 && (
            <div className="bg-[#111111]/90 border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="font-black text-xs uppercase tracking-wider text-zinc-500">Genres of Choice</h3>
              <div className="flex flex-wrap gap-1.5">
                {favGenres.map((g, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 bg-[#1A1A1A] border border-white/10 text-[10px] font-bold uppercase tracking-wider rounded-full text-zinc-300">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 3 Columns: Sub-tabs and lists */}
        <div className="lg:col-span-3 space-y-8">
          {/* Sub tab navigation */}
          <div className="flex border-b border-white/5 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            {[
              { id: 'activity', label: 'Recent Reviews', icon: MessageSquare },
              { id: 'favorites', label: 'Favorite Film Strip', icon: Bookmark },
              { id: 'dna', label: 'Movie DNA & Wrapped', icon: Award },
              { id: 'settings', label: 'Settings & Credentials', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center space-x-2 pb-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive ? 'text-[#F5C518] border-b-2 border-[#F5C518] font-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Activity Sub-Tab */}
          {activeSubTab === 'activity' && (
            <div className="space-y-4 animate-fadeIn">
              {reviews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] text-zinc-500 italic bg-[#111111]/40">
                  You haven't logged any review notes yet. Look for movies in Explore to publish notes!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] flex items-start space-x-5 shadow-lg">
                      <img src={rev.moviePoster} alt={rev.movieTitle} className="w-14 h-20 rounded-xl object-cover border border-white/5 cursor-pointer shrink-0 hover:scale-105 transition duration-300" onClick={() => onMovieClick(rev.movieId, rev.isTvShow)} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-white text-base hover:text-[#F5C518] cursor-pointer tracking-tight" onClick={() => onMovieClick(rev.movieId, rev.isTvShow)}>
                            {rev.movieTitle}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">{rev.createdAt}</span>
                        </div>
                        <p className="text-xs font-black text-[#F5C518] font-mono uppercase tracking-wider">{rev.title}</p>
                        <p className="text-zinc-400 text-xs leading-relaxed font-medium line-clamp-3">{rev.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites Sub-Tab */}
          {activeSubTab === 'favorites' && (
            <div className="animate-fadeIn">
              {favoriteMovies.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] text-zinc-500 italic bg-[#111111]/40">
                  You haven't flagged any movies or shows as "Favorites" inside your Watchlist yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {favoriteMovies.map(fav => (
                    <div
                      key={fav.id}
                      onClick={() => onMovieClick(fav.id, !!fav.isTvShow)}
                      className="group cursor-pointer bg-[#111111]/90 border border-white/5 p-3 rounded-[2rem] hover:border-[#F5C518]/30 hover:bg-[#1A1A1A] transition-all duration-300 shadow-md"
                    >
                      <div className="overflow-hidden rounded-2xl aspect-[2/3]">
                        <img src={fav.posterUrl} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" />
                      </div>
                      <h4 className="font-black text-xs truncate text-white mt-3.5 group-hover:text-[#F5C518] transition duration-300 uppercase tracking-tight">{fav.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono font-bold mt-1 uppercase">{fav.releaseDate.split('-')[0]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Movie DNA & Wrapped Sub-Tab */}
          {activeSubTab === 'dna' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-xl">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center space-x-2.5 uppercase font-sans">
                  <Award className="w-5.5 h-5.5 text-[#F5C518]" />
                  <span>Your Cinematic DNA Spec</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Calculated automatically from your ratings, genres, and watch history.
                </p>
                <MovieDNAWidget watchlist={watchlist} allMovies={allMovies} userFavoriteGenres={favGenres} />
              </div>

              <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-xl">
                <h3 className="text-xl font-black text-white tracking-tight flex items-center space-x-2.5 uppercase font-sans">
                  <Sparkles className="w-5.5 h-5.5 text-[#F5C518]" />
                  <span>Annual Movie Wrapped</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Your personalized summary of cinematic milestones this year.
                </p>
                <YearlyWrappedWidget watchlist={watchlist} allMovies={allMovies} userDisplayName={user.displayName} />
              </div>
            </div>
          )}

          {/* Settings Sub-Tab */}
          {activeSubTab === 'settings' && (
            <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-6 animate-fadeIn text-sm text-zinc-300 shadow-xl">
              
              {/* Credentials TMDB Sync block */}
              <div className="space-y-4 border-b border-white/5 pb-6">
                <h3 className="font-black text-white text-base flex items-center space-x-2 uppercase font-sans">
                  <Key className="w-4.5 h-4.5 text-[#F5C518]" />
                  <span>TMDb API Sync Credentials</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Supply your personal TMDb credentials to activate real-time infinite searches, trailer retrievals, and casting specs directly from the largest online media registry.
                </p>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={tmdbKey}
                    onChange={e => setTmdbKey(e.target.value)}
                    placeholder="Input TMDb Read Token or API Key..."
                    className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white focus:border-[#F5C518] outline-none font-mono"
                  />
                  <button
                    onClick={handleSaveTMDBKey}
                    className="px-6 py-3.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-black uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-[#F5C518]/10 hover:scale-105"
                  >
                    Save Key
                  </button>
                </div>
              </div>

              {/* Preferences: Dark mode, Language, Privacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/5 pb-6">
                <div className="space-y-4">
                  <h3 className="font-black text-white text-xs uppercase tracking-widest text-zinc-500 font-mono">Display Specifications</h3>
                  <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-white/5 text-xs font-mono font-bold">
                    <span>Dark Mode Preset</span>
                    <span className="text-[#F5C518]">DEFAULT ENABLED</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-black font-mono uppercase tracking-wider block">APP LANGUAGE</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3.5 text-xs text-white outline-none focus:border-[#F5C518]"
                    >
                      <option value="English">English (United States)</option>
                      <option value="Spanish">Español (Castellano)</option>
                      <option value="French">Français (France)</option>
                      <option value="Japanese">日本語 (Japan)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-white text-xs uppercase tracking-widest text-zinc-500 font-mono">Privacy & Notifications</h3>
                  <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-white/5 text-xs font-bold">
                    <span className="flex items-center space-x-1 font-mono uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5 mr-1.5 text-[#F5C518]" /> Profile Visibility
                    </span>
                    <button
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        isPrivate ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/15' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isPrivate ? 'Private' : 'Public'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] text-zinc-500 font-black font-mono uppercase tracking-wider block">NOTIFICATIONS</span>
                    <label className="flex items-center space-x-2.5 text-xs font-medium cursor-pointer">
                      <input type="checkbox" checked={notifFollowers} onChange={e => setNotifFollowers(e.target.checked)} className="rounded border-white/10 bg-[#1A1A1A] text-[#F5C518] focus:ring-0 w-4 h-4" />
                      <span>Alert on new follower events</span>
                    </label>
                    <label className="flex items-center space-x-2.5 text-xs font-medium cursor-pointer">
                      <input type="checkbox" checked={notifLikes} onChange={e => setNotifLikes(e.target.checked)} className="rounded border-white/10 bg-[#1A1A1A] text-[#F5C518] focus:ring-0 w-4 h-4" />
                      <span>Alert on review liking events</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dangerous operations */}
              <div className="space-y-4">
                <h3 className="font-black text-red-500 text-xs uppercase tracking-widest font-mono">Dangerous Territory</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-5 py-3 bg-[#1A1A1A] border border-white/5 hover:border-[#F5C518]/30 hover:text-[#F5C518] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 text-zinc-400" />
                    <span>Log Out Account</span>
                  </button>

                  <button
                    onClick={handleDeleteMyAccount}
                    className="flex items-center space-x-2 px-5 py-3 bg-red-600/10 border border-red-500/15 hover:bg-red-600 hover:text-white text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Decommission Account</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Network users follow modal list */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] max-w-md w-full p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-sans font-black tracking-tight uppercase text-white">{showNetworkModal} Network</h3>
              <button onClick={() => setShowNetworkModal(null)} className="p-1 hover:text-[#F5C518] transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {networkUsers.length === 0 ? (
                <p className="text-zinc-500 text-xs italic text-center py-6 font-medium">No users in this list.</p>
              ) : (
                networkUsers.map(nUser => (
                  <div key={nUser.id} className="flex items-center justify-between bg-[#1A1A1A] p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-3">
                      <img src={nUser.avatarUrl} alt={nUser.username} className="w-8 h-8 rounded-full object-cover border border-white/5" />
                      <div>
                        <p className="text-sm font-bold text-white">{nUser.displayName}</p>
                        <p className="text-xs text-zinc-500 font-mono font-semibold">@{nUser.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile edit modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveProfile} className="bg-[#111111] border border-white/5 rounded-[2.5rem] max-w-lg w-full p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-sans font-black tracking-tight text-white uppercase">Profile Specs</h3>
              <button type="button" onClick={() => setIsEditing(false)} className="p-1 hover:text-[#F5C518] transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-2">
                <label className="text-zinc-500 block font-black uppercase tracking-wider text-[10px]">DISPLAY NAME</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3.5 text-white focus:border-[#F5C518] outline-none font-sans text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 block font-black uppercase tracking-wider text-[10px]">AVATAR IMAGE (LOCAL DEVICE)</label>
                <div className="relative group flex flex-col items-center justify-center bg-[#1A1A1A] border-2 border-dashed border-white/10 hover:border-[#F5C518]/50 rounded-xl p-3 transition-all duration-300 text-center cursor-pointer min-h-[82px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setAvatarUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex items-center space-x-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-[#F5C518]/30 group-hover:scale-105 transition shrink-0" />
                    ) : (
                      <Upload className="w-4 h-4 text-zinc-500 group-hover:text-[#F5C518] transition shrink-0" />
                    )}
                    <div className="text-left">
                      <p className="text-zinc-300 font-sans font-bold text-xs group-hover:text-[#F5C518] transition">Select Photo</p>
                      <p className="text-[9px] text-zinc-500 font-mono">Load from local device</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <label className="text-zinc-500 block font-black uppercase tracking-wider text-[10px]">BANNER IMAGE (LOCAL DEVICE)</label>
              <div className="relative group flex items-center justify-center bg-[#1A1A1A] border-2 border-dashed border-white/10 hover:border-[#F5C518]/50 rounded-xl p-3 transition-all duration-300 text-center cursor-pointer min-h-[82px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setBannerUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex items-center space-x-4 w-full">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner Preview" className="h-10 w-24 rounded-lg object-cover border border-[#F5C518]/30 group-hover:scale-105 transition shrink-0" />
                  ) : (
                    <Upload className="w-4 h-4 text-zinc-500 group-hover:text-[#F5C518] transition shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="text-zinc-300 font-sans font-bold text-xs group-hover:text-[#F5C518] transition">Select Banner</p>
                    <p className="text-[9px] text-zinc-500 font-mono">Load from local device</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <label className="text-zinc-500 block font-black uppercase tracking-wider text-[10px]">BIOGRAPHY</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3.5 text-white font-sans text-sm focus:border-[#F5C518] outline-none font-medium leading-relaxed"
              />
            </div>

            {/* Favorite genres picker list */}
            <div className="space-y-2 text-xs font-mono">
              <label className="text-zinc-500 block font-black uppercase tracking-wider text-[10px]">FAVORITE GENRES</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Animation', 'Mystery', 'Romance', 'Horror'].map(g => {
                  const isChecked = favGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGenreToggle(g)}
                      className={`px-3.5 py-1.5 border rounded-full text-xs transition font-bold font-sans cursor-pointer ${
                        isChecked
                          ? 'bg-[#F5C518] text-black border-[#F5C518] font-black shadow-md shadow-[#F5C518]/15'
                          : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/35'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-black rounded-xl transition text-xs tracking-wider uppercase font-sans cursor-pointer shadow-lg shadow-[#F5C518]/15 hover:scale-[1.02]"
            >
              Save Profile Specifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
