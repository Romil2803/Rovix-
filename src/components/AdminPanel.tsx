import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Film, MessageSquare, Flag, Megaphone, Plus, Trash2, Check, X, TrendingUp } from 'lucide-react';
import {
  getMovies,
  adminAddMovie,
  adminDeleteMovie,
  getReviews,
  getReports,
  resolveReport,
  getAnnouncements,
  addAnnouncement,
  deleteReview
} from '../db/storage';
import { Movie, Review, Report, Announcement, User } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminPanelProps {
  onMovieClick: (id: string, isTv: boolean) => void;
  usersList: User[];
  onUpdateUsersList: () => void;
}

export default function AdminPanel({ onMovieClick, usersList, onUpdateUsersList }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<'stats' | 'users' | 'media' | 'reviews' | 'announcements'>('stats');

  // Database states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Create Movie Form States
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [overview, setOverview] = useState('');
  const [genres, setGenres] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [isTvShow, setIsTvShow] = useState(false);
  const [seasons, setSeasons] = useState('1');
  const [episodes, setEpisodes] = useState('10');
  const [director, setDirector] = useState('');
  const [budget, setBudget] = useState('50000000');
  const [releaseDate, setReleaseDate] = useState('2024-01-01');

  // Announcement Form States
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annBadge, setAnnBadge] = useState('NEW');

  // Load Data
  const loadData = () => {
    setMovies(getMovies());
    setReviews(getReviews());
    setReports(getReports());
    setAnnouncements(getAnnouncements());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleAddMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !overview) return;

    const parsedBudget = parseInt(budget) || 0;
    const media: Movie = {
      id: 'custom_' + Date.now(),
      title,
      tagline: tagline || 'A custom cinematic piece.',
      overview,
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=80',
      backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
      genres: genres.split(',').map(g => g.trim()).filter(Boolean),
      runtime: 120,
      releaseDate: releaseDate || '2024-01-01',
      language: 'English',
      country: 'United States',
      status: 'Released',
      budget: parsedBudget,
      revenue: 0,
      director: director || 'Unknown Director',
      cast: [
        { name: 'Unknown Actor', character: 'Lead Role', profileUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' }
      ],
      productionCompanies: ['Rovix Studios'],
      trailerUrl: '',
      gallery: [],
      streamingPlatforms: ['Netflix'],
      rating: 4.0,
      communityRating: 4.0,
      totalRatingsCount: 1,
      ...(isTvShow ? { isTvShow: true, seasons: parseInt(seasons) || 1, episodes: parseInt(episodes) || 10 } : {})
    };

    adminAddMovie(media);
    loadData();
    
    // Reset Form
    setTitle('');
    setTagline('');
    setOverview('');
    setGenres('');
    setPosterUrl('');
    setBackdropUrl('');
    setDirector('');
  };

  const handleDeleteMovie = (id: string) => {
    adminDeleteMovie(id);
    loadData();
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    addAnnouncement(annTitle, annContent, annBadge);
    setAnnTitle('');
    setAnnContent('');
    loadData();
  };

  const handleResolveReport = (reportId: string, action: 'keep' | 'delete') => {
    resolveReport(reportId, action);
    loadData();
  };

  const handleMakeAdmin = (userId: string) => {
    const rawUsers = localStorage.getItem('rovix_users');
    if (rawUsers) {
      const parsed: User[] = JSON.parse(rawUsers);
      const updated = parsed.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u);
      localStorage.setItem('rovix_users', JSON.stringify(updated));
      onUpdateUsersList();
    }
  };

  const handleDeleteUser = (userId: string) => {
    const rawUsers = localStorage.getItem('rovix_users');
    if (rawUsers) {
      const parsed: User[] = JSON.parse(rawUsers).filter((u: User) => u.id !== userId);
      localStorage.setItem('rovix_users', JSON.stringify(parsed));
      onUpdateUsersList();
    }
  };

  // Recharts Simulated growth data
  const statGrowthData = [
    { name: 'Jan', Activity: 240, Reviews: 140 },
    { name: 'Feb', Activity: 480, Reviews: 220 },
    { name: 'Mar', Activity: 610, Reviews: 380 },
    { name: 'Apr', Activity: 820, Reviews: 510 },
    { name: 'May', Activity: 950, Reviews: 730 },
    { name: 'Jun', Activity: 1200, Reviews: 890 },
    { name: 'Jul', Activity: 1540, Reviews: 1040 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-24 text-white min-h-screen">
      {/* Title */}
      <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-4">
        <div className="p-3 bg-[#FFD700] rounded-2xl text-black shadow-lg shadow-[#FFD700]/10">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-sans font-bold tracking-tight font-display">Admin Control Room</h1>
          <p className="text-gray-400 text-sm">Monitor tracking metrics, manage content, and oversee the Rovix community.</p>
        </div>
      </div>

      {/* Grid Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { id: 'stats', label: 'Dashboard', icon: TrendingUp },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'media', label: 'Movies & TV', icon: Film },
          { id: 'reviews', label: 'Reports', icon: Flag },
          { id: 'announcements', label: 'Bulletins', icon: Megaphone }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                isActive
                  ? 'bg-[#FFD700] text-black border-[#FFD700] font-bold shadow-lg shadow-[#FFD700]/10'
                  : 'bg-zinc-900/60 border-white/5 text-gray-300 hover:border-white/10 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl">
        
        {/* STATS / DASHBOARD SECTION */}
        {activeSection === 'stats' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Numeric Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                <div className="flex justify-between items-start text-gray-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="text-3xl font-bold mt-2 font-mono">{usersList.length}</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center">
                  <span>+12% vs last month</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                <div className="flex justify-between items-start text-gray-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Media</span>
                  <Film className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="text-3xl font-bold mt-2 font-mono">{movies.length}</div>
                <div className="text-xs text-[#FFD700] mt-1 font-mono">Live TMDB Sync Active</div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                <div className="flex justify-between items-start text-gray-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Reviews</span>
                  <MessageSquare className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="text-3xl font-bold mt-2 font-mono">{reviews.length}</div>
                <div className="text-xs text-emerald-400 mt-1">+24 new today</div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                <div className="flex justify-between items-start text-gray-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Reports</span>
                  <Flag className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-3xl font-bold mt-2 font-mono text-red-400">{reports.filter(r => !r.resolved).length}</div>
                <div className="text-xs text-red-400 mt-1">Requires Moderation</div>
              </div>
            </div>

            {/* Growth Graph using Recharts */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Community Engagement Velocity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statGrowthData}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                    <Area type="monotone" dataKey="Activity" stroke="#FFD700" fillOpacity={1} fill="url(#colorActivity)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Reviews" stroke="#a855f7" fillOpacity={1} fill="url(#colorReviews)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT SECTION */}
        {activeSection === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-bold">Manage Rovix Accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase font-mono">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Bio</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-white/[2%]">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold">{u.displayName}</p>
                          <p className="text-xs text-gray-500 font-mono">@{u.username}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isAdmin ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20' : 'bg-zinc-800 text-gray-300'
                        }`}>
                          {u.isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-400">{u.bio || 'No biography set.'}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono">{u.joinedDate}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleMakeAdmin(u.id)}
                          className="px-3 py-1 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-md text-xs transition"
                        >
                          Toggle Admin
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-md text-red-400 transition inline-flex items-center"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MEDIA MANAGEMENT SECTION */}
        {activeSection === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Create Media Form */}
            <div className="lg:col-span-1 bg-zinc-900/40 border border-white/5 p-5 rounded-xl space-y-4">
              <h3 className="text-md font-bold text-[#FFD700] flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Media Catalog</span>
              </h3>
              <form onSubmit={handleAddMovie} className="space-y-3.5 text-sm">
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Inception"
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="e.g. Your mind is the scene of the crime."
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Overview</label>
                  <textarea
                    required
                    value={overview}
                    onChange={e => setOverview(e.target.value)}
                    placeholder="Provide a cinematic description..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Type</label>
                    <select
                      value={isTvShow ? 'tv' : 'movie'}
                      onChange={e => setIsTvShow(e.target.value === 'tv')}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                    >
                      <option value="movie">Movie</option>
                      <option value="tv">TV Show</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Release Date</label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={e => setReleaseDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                    />
                  </div>
                </div>

                {isTvShow && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 text-xs font-bold mb-1">Seasons</label>
                      <input
                        type="number"
                        value={seasons}
                        onChange={e => setSeasons(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-bold mb-1">Episodes</label>
                      <input
                        type="number"
                        value={episodes}
                        onChange={e => setEpisodes(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Director</label>
                    <input
                      type="text"
                      value={director}
                      onChange={e => setDirector(e.target.value)}
                      placeholder="e.g. Christopher Nolan"
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Budget ($)</label>
                    <input
                      type="number"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={e => setGenres(e.target.value)}
                    placeholder="e.g. Sci-Fi, Thriller, Action"
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Poster Image URL (Optional)</label>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={e => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black py-3 rounded-xl font-bold transition duration-300 shadow-md cursor-pointer"
                >
                  Create Record
                </button>
              </form>
            </div>

            {/* Media List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-md font-bold">Current Catalog Database</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {movies.map(m => (
                  <div key={m.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition">
                    <div className="flex items-center space-x-4">
                      <img src={m.posterUrl} alt={m.title} className="w-12 h-16 rounded-md object-cover border border-white/10" />
                      <div>
                        <h4 className="font-semibold hover:text-[#FFD700] cursor-pointer" onClick={() => onMovieClick(m.id, !!m.isTvShow)}>
                          {m.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono mt-1">
                          <span>{m.releaseDate.split('-')[0]}</span>
                          <span>•</span>
                          <span>{m.isTvShow ? 'TV Show' : 'Movie'}</span>
                          <span>•</span>
                          <span>{m.genres.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMovie(m.id)}
                      className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-red-400 transition"
                      title="Delete Media"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS MODERATION SECTION */}
        {activeSection === 'reviews' && (
          <div className="space-y-6 animate-fadeIn text-sm">
            <h2 className="text-lg font-bold">Reported Community Activity</h2>
            {reports.filter(r => !r.resolved).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-gray-500">
                All clean! No reviews require active moderation right now.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.filter(r => !r.resolved).map(rep => {
                  const targetReview = reviews.find(rev => rev.id === rep.targetId);
                  return (
                    <div key={rep.id} className="bg-red-500/5 border border-red-500/15 p-5 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">FLAGGED REVIEW</span>
                          <span className="text-gray-400 text-xs">Reported by</span>
                          <span className="font-semibold text-white font-mono text-xs">@{rep.reporterUsername}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-500 text-xs">{new Date(rep.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Reason For Flag:</p>
                          <p className="text-white font-medium bg-zinc-950 p-2.5 rounded-lg mt-1 text-xs italic">"{rep.reason}"</p>
                        </div>

                        {targetReview ? (
                          <div className="bg-zinc-900/60 p-4 rounded-lg border border-white/5 space-y-2 mt-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span className="font-bold">Reviewed Content: {targetReview.movieTitle}</span>
                              <span>By @{targetReview.username}</span>
                            </div>
                            <h4 className="font-semibold text-white">{targetReview.title}</h4>
                            <p className="text-gray-300 text-xs">{targetReview.body}</p>
                          </div>
                        ) : (
                          <p className="text-red-400 text-xs italic">Target review has already been deleted or removed.</p>
                        )}
                      </div>

                      <div className="flex md:flex-col items-stretch space-x-2 md:space-x-0 md:space-y-2 shrink-0">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'keep')}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-lg text-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Review</span>
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'delete')}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-red-600 text-white hover:bg-red-500 font-bold rounded-lg text-xs transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Delete Content</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BULLETIN AND ANNOUNCEMENTS SECTION */}
        {activeSection === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn text-sm">
            {/* Create Announcement Form */}
            <div className="lg:col-span-1 bg-zinc-900/40 border border-white/5 p-5 rounded-xl space-y-4">
              <h3 className="text-md font-bold text-[#FFD700] flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Publish Bulletin</span>
              </h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Bulletin Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    placeholder="e.g. Summer Film Festival 2026"
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Content</label>
                  <textarea
                    required
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    placeholder="Write announcement body..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold mb-1">Badge Type</label>
                  <select
                    value={annBadge}
                    onChange={e => setAnnBadge(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white focus:border-[#FFD700] outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="ALERT">ALERT</option>
                    <option value="EVENT">EVENT</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black py-3 rounded-xl font-bold transition duration-300 shadow-md cursor-pointer"
                >
                  Publish Bulletin
                </button>
              </form>
            </div>

            {/* Current Announcements */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-md font-bold">Published Community Announcements</h3>
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 relative hover:border-white/10 transition">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#FFD700] text-black text-[10px] font-extrabold rounded-md font-mono uppercase">
                        {ann.badge || 'INFO'}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{ann.createdAt}</span>
                    </div>
                    <h4 className="text-md font-bold text-white mb-1">{ann.title}</h4>
                    <p className="text-gray-300 leading-relaxed text-xs">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
