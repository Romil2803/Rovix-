import React, { useState, useEffect } from 'react';
import {
  Film,
  Compass,
  Search,
  Bookmark,
  User,
  Star,
  Bell,
  X,
  Plus,
  CheckCircle,
  TrendingUp,
  Award,
  BookOpen,
  Eye,
  Settings,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
  Globe,
  Calendar,
  Sparkles,
  Tv,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  initDatabase,
  getCurrentUser,
  setCurrentUser,
  getMovies,
  getReviews,
  getWatchlist,
  toggleWatchlist,
  getUserRating,
  saveRating,
  getNotifications,
  markNotificationsAsRead,
  getAnnouncements,
  toggleFollow,
  isFollowing,
  addNotification,
  subscribeToDatabaseChanges,
  getUsersList,
  getFollowsList,
  getCustomWatchlists,
  createCustomWatchlist,
  updateCustomWatchlist,
  deleteCustomWatchlist,
  removeMovieFromCustomWatchlist
} from './db/storage';
import PersonalizedHomeFeed from './components/PersonalizedHomeFeed';
import { Movie, Review, User as UserType, Notification, Announcement, WatchlistStatus, CustomWatchlist } from './types';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getTrendingMovies, getTrendingTVShows, searchTMDB, getPopularMovies, getPopularTVShows, getWatchProviders, getLocalizedDiscover, discoverMedia, GENRE_MAP, getTopRated, getWatchProvidersForRegion, getMovieDetails } from './lib/tmdb';
import { useIPGeolocation } from './lib/useIPGeolocation';

// Import Modular tabs/panels
import BottomNavigation from './components/BottomNavigation';
import MovieDetails from './components/MovieDetails';
import ProfileTab from './components/ProfileTab';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';

const ALL_YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => String(2026 - i));
const ALL_LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Spanish' },
  { code: 'FR', name: 'French' },
  { code: 'JA', name: 'Japanese' },
  { code: 'KO', name: 'Korean' },
  { code: 'ZH', name: 'Chinese' },
  { code: 'HI', name: 'Hindi' },
  { code: 'DE', name: 'German' },
  { code: 'IT', name: 'Italian' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'RU', name: 'Russian' },
  { code: 'AR', name: 'Arabic' },
  { code: 'TR', name: 'Turkish' },
  { code: 'NL', name: 'Dutch' },
  { code: 'SV', name: 'Swedish' },
  { code: 'NO', name: 'Norwegian' },
  { code: 'DA', name: 'Danish' },
  { code: 'FI', name: 'Finnish' },
  { code: 'PL', name: 'Polish' }
];
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' }
];

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🏳️';
  }
}

export default function App() {
  const [currentUser, setLocalCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [homeSubTab, setHomeSubTab] = useState<'featured' | 'personalized'>('featured');

  // Master Lists
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);

  // Selected Overlay States
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedMovieIsTv, setSelectedMovieIsTv] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [selectedUserOverlay, setSelectedUserOverlay] = useState<UserType | null>(null);

  // Search tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGenre, setSearchGenre] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');
  const [searchPlatform, setSearchPlatform] = useState('');
  const [searchCountry, setSearchCountry] = useState('US');
  const [dynamicCountries, setDynamicCountries] = useState(COUNTRIES);
  const [availableProviders, setAvailableProviders] = useState<string[]>([
    'Netflix', 'Prime Video', 'Disney+', 'Apple TV+', 'Max', 'Hulu', 'Crunchyroll', 'Peacock', 'Paramount+', 'JioCinema', 'Hotstar', 'Zee5', 'SonyLIV', 'YouTube', 'Google Play Movies'
  ]);

  // Fetch watch providers for searchCountry
  useEffect(() => {
    const fetchProvidersForCountry = async () => {
      if (!searchCountry) return;
      try {
        const providers = await getWatchProvidersForRegion(searchCountry);
        if (providers && providers.length > 0) {
          setAvailableProviders(providers);
        }
      } catch (err) {
        console.warn('Error fetching providers for selected region', err);
      }
    };
    fetchProvidersForCountry();
  }, [searchCountry]);

  const { code: detectedCountryCode, name: detectedCountryName, flag: detectedCountryFlag, loading: loadingGeo } = useIPGeolocation();

  // Auto-detect user's country/region via IP Geolocation custom hook
  useEffect(() => {
    if (!loadingGeo && detectedCountryCode) {
      const upperCode = detectedCountryCode.toUpperCase();
      setSearchCountry(upperCode);
      setHomeCountry(upperCode);
      localStorage.setItem('rovix_home_country', upperCode);
      
      // Add dynamically if not in original COUNTRIES
      setDynamicCountries(prev => {
        if (prev.some(c => c.code === upperCode)) return prev;
        return [...prev, { code: upperCode, name: detectedCountryName || upperCode, flag: detectedCountryFlag }];
      });
    }
  }, [detectedCountryCode, detectedCountryName, detectedCountryFlag, loadingGeo]);

  const [searchSort, setSearchSort] = useState('popularity');
  const [searchPageMovies, setSearchPageMovies] = useState<Movie[]>([]);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState<boolean>(false);
  const [hasMoreSearch, setHasMoreSearch] = useState<boolean>(true);

  // Watchlist tab states
  const [watchlistFilter, setWatchlistFilter] = useState<WatchlistStatus>('Plan to Watch');
  const [watchlistQuery, setWatchlistQuery] = useState('');
  const [watchlistType, setWatchlistType] = useState<'standard' | 'custom'>('standard');
  const [customWatchlists, setCustomWatchlists] = useState<CustomWatchlist[]>([]);
  const [selectedCustomWatchlistId, setSelectedCustomWatchlistId] = useState<string | null>(null);

  // Custom watchlist editor modal/drawer/card state
  const [showCreateWatchlistModal, setShowCreateWatchlistModal] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [newWlDesc, setNewWlDesc] = useState('');
  const [newWlIsPrivate, setNewWlIsPrivate] = useState(false);

  // Editing custom watchlist state
  const [editingWatchlistId, setEditingWatchlistId] = useState<string | null>(null);
  const [editWlName, setEditWlName] = useState('');
  const [editWlDesc, setEditWlDesc] = useState('');
  const [editWlIsPrivate, setEditWlIsPrivate] = useState(false);

  // Regionalized Home tab states
  const [homeCountry, setHomeCountry] = useState<string>(() => localStorage.getItem('rovix_home_country') || 'IN');
  const [homeWorldMovies, setHomeWorldMovies] = useState<Movie[]>([]);
  const [homeIndianMovies, setHomeIndianMovies] = useState<Movie[]>([]);
  const [homeSpotlightMovies, setHomeSpotlightMovies] = useState<Movie[]>([]);
  const [homeTVShows, setHomeTVShows] = useState<Movie[]>([]);
  const [loadingHomeContent, setLoadingHomeContent] = useState<boolean>(false);

  // Alerts
  const [toast, setToast] = useState<string | null>(null);

  // Initialize DB
  useEffect(() => {
    initDatabase();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setLocalCurrentUser(null);
      }
    });

    const unsubscribeDb = subscribeToDatabaseChanges(() => {
      setLocalCurrentUser(getCurrentUser());
      loadAllMedia();
    });

    loadAllMedia();

    return () => {
      unsubscribeAuth();
      unsubscribeDb();
    };
  }, []);

  const loadAllMedia = async () => {
    setAllReviews(getReviews());
    setAnnouncements(getAnnouncements());
    setUsersList(getUsersList());
    setCustomWatchlists(getCustomWatchlists());
  };

  const loadHomeContent = async () => {
    setLoadingHomeContent(true);
    try {
      // 1. Fetch Hollywood / World blockbusters
      const worldMovies = await getLocalizedDiscover('movie', 'US', 1);
      // 2. Fetch Indian Cinema
      const indianMovies = await getLocalizedDiscover('movie', 'IN', 1);
      // 3. Fetch Featured Spotlights / Top Rated masterpieces
      const spotlightMovies = await getTopRated('movie');
      // 4. Fetch TV Shows
      const tvShows = await getTrendingTVShows('week', 1);

      // Filter out any daily soap TV show (genre "Soap" or name/overview containing soap indicators)
      const filteredTVShows = tvShows.filter(show => {
        const isSoap = show.genres.some(g => {
          const lower = g.toLowerCase();
          return lower === 'soap' || lower.includes('soap') || lower.includes('telenovela');
        });
        return !isSoap;
      });

      setHomeWorldMovies(worldMovies.slice(0, 20));
      setHomeIndianMovies(indianMovies.slice(0, 20));
      setHomeSpotlightMovies(spotlightMovies.slice(0, 20));
      setHomeTVShows(filteredTVShows.slice(0, 20));
    } catch (err) {
      console.warn('Failed to load localized home content', err);
      const fallbackMovies = getMovies().filter(m => !m.isTvShow);
      const fallbackTV = getMovies().filter(m => m.isTvShow);
      setHomeWorldMovies(fallbackMovies);
      setHomeIndianMovies(fallbackMovies);
      setHomeSpotlightMovies(fallbackMovies);
      setHomeTVShows(fallbackTV);
    } finally {
      setLoadingHomeContent(false);
    }
  };

  useEffect(() => {
    loadHomeContent();
  }, []);

  useEffect(() => {
    const combined = [...homeWorldMovies, ...homeIndianMovies, ...homeSpotlightMovies, ...homeTVShows];
    if (combined.length > 0) {
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
      setAllMovies(unique);
    }
  }, [homeWorldMovies, homeIndianMovies, homeSpotlightMovies, homeTVShows]);

  const handleAuthSuccess = (u: UserType) => {
    setCurrentUser(u);
    setLocalCurrentUser(u);
    loadAllMedia();
    triggerToast(`Welcome back, ${u.displayName}!`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut failed", e);
    }
    setCurrentUser(null);
    setLocalCurrentUser(null);
    setActiveTab('home');
    triggerToast('Logged out of Rovix gateway.');
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Movie click opens details modal
  const handleMovieClick = (id: string, isTvShow: boolean) => {
    setSelectedMovieId(id);
    setSelectedMovieIsTv(isTvShow);
  };

  // Quick Watchlist click
  const handleQuickWatchlist = async (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    if (!currentUser) return;
    await toggleWatchlist(currentUser.id, movie.id, movie.title, movie.posterUrl, !!movie.isTvShow, 'Plan to Watch');
    triggerToast(`Watchlist updated for "${movie.title}"`);
    loadAllMedia();
  };

  // Quick rating score
  const handleQuickRate = async (e: React.MouseEvent, movieId: string, score: number) => {
    e.stopPropagation();
    if (!currentUser) return;
    await saveRating(currentUser.id, movieId, score);
    triggerToast(`Rated movie ${score} Stars!`);
    loadAllMedia();
  };

  // Toggle user follow connection
  const handleToggleFollowUser = async (targetUser: UserType) => {
    if (!currentUser) return;
    const isNowFollowing = await toggleFollow(currentUser.id, targetUser.id);
    triggerToast(isNowFollowing ? `Following @${targetUser.username}` : `Unfollowed @${targetUser.username}`);
    
    // Reload user models
    const users = getUsersList();
    setUsersList(users);
    const updatedTarget = users.find(u => u.id === targetUser.id);
    if (updatedTarget) {
      setSelectedUserOverlay(updatedTarget);
    }
    setLocalCurrentUser(getCurrentUser());
  };

  // Sync users list from Admin operations
  const handleUpdateUsersList = () => {
    setUsersList(getUsersList());
  };

  // Open User Profile Card Overlay
  const handleOpenUserOverlay = (username: string) => {
    const found = usersList.find(u => u.username === username);
    if (found) {
      setSelectedUserOverlay(found);
    }
  };

  // Debounce state for searchQuery
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getGenreIdByName = (name: string): number | null => {
    if (!name) return null;
    const entry = Object.entries(GENRE_MAP).find(([_, val]) => val.toLowerCase() === name.toLowerCase());
    return entry ? Number(entry[0]) : null;
  };

  const matchPlatform = (moviePlatforms: string[], searchPlat: string): boolean => {
    if (!searchPlat) return true;
    const searchLower = searchPlat.toLowerCase();
    return moviePlatforms.some(plat => {
      const platLower = plat.toLowerCase();
      if (searchLower === 'netflix') return platLower.includes('netflix');
      if (searchLower === 'prime video') return platLower.includes('prime video') || platLower.includes('amazon');
      if (searchLower === 'disney+') return platLower.includes('disney');
      if (searchLower === 'apple tv+') return platLower.includes('apple');
      if (searchLower === 'max') return platLower.includes('max') || platLower.includes('hbo');
      if (searchLower === 'hulu') return platLower.includes('hulu');
      if (searchLower === 'paramount+') return platLower.includes('paramount');
      if (searchLower === 'peacock') return platLower.includes('peacock');
      if (searchLower === 'crunchyroll') return platLower.includes('crunchyroll');
      if (searchLower === 'jiocinema') return platLower.includes('jio');
      if (searchLower === 'hotstar') return platLower.includes('hotstar') || platLower.includes('disney');
      if (searchLower === 'zee5') return platLower.includes('zee');
      if (searchLower === 'sonyliv') return platLower.includes('sony') || platLower.includes('liv');
      return platLower.includes(searchLower) || searchLower.includes(platLower);
    });
  };

  // Fetch search page data from TMDB
  const fetchSearchPageData = async (query: string, page: number, isNewSearch: boolean) => {
    setIsSearchingTmdb(true);
    try {
      let results: Movie[] = [];
      if (query.trim() !== '') {
        const rawResults = await searchTMDB(query, page);
        // Filter out people (cast/crew matching) and map as Movie array
        results = rawResults.filter(item => item.type !== 'person') as Movie[];
      } else if (searchGenre || searchYear || searchLanguage || searchPlatform || searchCountry !== 'US') {
        const genreId = getGenreIdByName(searchGenre);
        const params: Record<string, string> = {
          page: String(page),
          sort_by: searchSort === 'rating' ? 'vote_average.desc' : (searchSort === 'newest' ? 'primary_release_date.desc' : 'popularity.desc'),
        };
        if (genreId) params.with_genres = String(genreId);
        if (searchYear) params.primary_release_year = searchYear;
        if (searchLanguage) params.with_original_language = searchLanguage.toLowerCase();
        
        if (searchCountry) {
          params.watch_region = searchCountry;
        }

        const discoveredMovies = await discoverMedia('movie', params);
        const discoveredTV = await discoverMedia('tv', params);

        const merged: Movie[] = [];
        const maxLen = Math.max(discoveredMovies.length, discoveredTV.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < discoveredMovies.length) merged.push(discoveredMovies[i]);
          if (i < discoveredTV.length) merged.push(discoveredTV[i]);
        }
        results = merged;
      } else {
        // If query is empty, load trending movies and TV shows for that page!
        const trendingMovies = await getTrendingMovies('day', page);
        const trendingTV = await getTrendingTVShows('day', page);
        
        // Merge them nicely
        const merged: Movie[] = [];
        const maxLen = Math.max(trendingMovies.length, trendingTV.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < trendingMovies.length) merged.push(trendingMovies[i]);
          if (i < trendingTV.length) merged.push(trendingTV[i]);
        }
        results = merged;
      }

      if (results.length === 0) {
        setHasMoreSearch(false);
      } else {
        // Fetch watch providers in parallel for all results
        let finalizedResults: Movie[] = results;
        try {
          finalizedResults = await Promise.all(results.map(async (m) => {
            const providers = await getWatchProviders(m.id, !!m.isTvShow);
            if (providers) {
              return {
                ...m,
                rawProviders: providers
              };
            }
            return m;
          }));
        } catch (e) {
          console.warn('Failed to fetch watch providers for results page', e);
        }

        setSearchPageMovies(prev => {
          if (isNewSearch) {
            return finalizedResults;
          } else {
            // Filter duplicates
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNew = finalizedResults.filter(m => !existingIds.has(m.id));
            return [...prev, ...uniqueNew];
          }
        });
        setHasMoreSearch(results.length >= 10);
      }
    } catch (err) {
      console.error('Error fetching TMDB search data', err);
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  // Effect to reset page and fetch first page on query/activeTab/filters changes
  useEffect(() => {
    if (activeTab === 'search') {
      setSearchPage(1);
      setHasMoreSearch(true);
      fetchSearchPageData(debouncedQuery, 1, true);
    }
  }, [debouncedQuery, activeTab, searchGenre, searchYear, searchLanguage, searchPlatform, searchCountry, searchSort]);

  // Effect to fetch subsequent pages when searchPage increments
  useEffect(() => {
    if (activeTab === 'search' && searchPage > 1) {
      fetchSearchPageData(debouncedQuery, searchPage, false);
    }
  }, [searchPage]);

  // Filter Search results as user types
  const filteredSearchMovies = searchPageMovies.map(m => {
    if (m.rawProviders) {
      const localeData = m.rawProviders[searchCountry];
      const list: string[] = [];
      if (localeData) {
        if (localeData.flatrate) {
          localeData.flatrate.forEach((p: any) => list.push(p.provider_name));
        }
        if (localeData.rent) {
          localeData.rent.forEach((p: any) => list.push(p.provider_name));
        }
        if (localeData.buy) {
          localeData.buy.forEach((p: any) => list.push(p.provider_name));
        }
      }
      return {
        ...m,
        streamingPlatforms: Array.from(new Set(list))
      };
    }
    return m;
  }).filter(m => {
    const matchesGenre = !searchGenre || m.genres.some(g => {
      const normalizedGenre = g.toLowerCase();
      const normalizedSearch = searchGenre.toLowerCase();
      return normalizedGenre.includes(normalizedSearch) || normalizedSearch.includes(normalizedGenre);
    });
    const matchesYear = !searchYear || (m.releaseDate && m.releaseDate.includes(searchYear));
    const matchesLang = !searchLanguage || m.language.toUpperCase() === searchLanguage.toUpperCase();
    const matchesPlatform = !searchPlatform || matchPlatform(m.streamingPlatforms, searchPlatform);
    return matchesGenre && matchesYear && matchesLang && matchesPlatform;
  }).sort((a, b) => {
    if (searchSort === 'rating') return b.communityRating - a.communityRating;
    if (searchSort === 'newest') return b.releaseDate.localeCompare(a.releaseDate);
    if (searchSort === 'oldest') return a.releaseDate.localeCompare(b.releaseDate);
    return b.totalRatingsCount - a.totalRatingsCount; // default popularity
  });

  const [selectedCustomWlMovies, setSelectedCustomWlMovies] = useState<Movie[]>([]);

  // Effect to resolve movie details for custom watchlist items
  useEffect(() => {
    const loadWlMovies = async () => {
      if (!selectedCustomWatchlistId) {
        setSelectedCustomWlMovies([]);
        return;
      }
      const wl = customWatchlists.find(c => c.id === selectedCustomWatchlistId);
      if (!wl || !wl.movieIds || wl.movieIds.length === 0) {
        setSelectedCustomWlMovies([]);
        return;
      }
      try {
        const resolvedMovies = await Promise.all(
          wl.movieIds.map(async (id) => {
            const existing = allMovies.find(m => m.id === id);
            if (existing) return existing;
            const details = await getMovieDetails(id, false, searchCountry);
            return details;
          })
        );
        setSelectedCustomWlMovies(resolvedMovies.filter((m): m is Movie => m !== null));
      } catch (e) {
        console.error("Failed to load custom watchlist movies", e);
      }
    };
    loadWlMovies();
  }, [selectedCustomWatchlistId, customWatchlists, allMovies, searchCountry]);

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Watchlist filter lists
  const myWatchlistItems = getWatchlist(currentUser.id).filter(w => {
    const matchesStatus = w.status === watchlistFilter;
    const matchesQuery = w.movieTitle.toLowerCase().includes(watchlistQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const myCustomWatchlists = customWatchlists.filter(cw => {
    const matchesUser = cw.userId === currentUser.id;
    const matchesQuery = cw.name.toLowerCase().includes(watchlistQuery.toLowerCase()) || cw.description.toLowerCase().includes(watchlistQuery.toLowerCase());
    return matchesUser && matchesQuery;
  });

  const unreadNotifications = getNotifications(currentUser.id).filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#090909] text-white selection:bg-[#F5C518] selection:text-black font-sans relative overflow-x-hidden">
      
      {/* Subtle Background Bento Glow Effects */}
      <div className="fixed top-[-10%] right-[-10%] w-[55%] h-[55%] bento-glow-top opacity-70 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[45%] h-[45%] bento-glow-bottom opacity-70 blur-[130px] pointer-events-none z-0" />
      
      {/* Dynamic Toast Container */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#F5C518] text-black px-6 py-4 rounded-2xl font-black shadow-2xl shadow-[#F5C518]/20 z-50 animate-bounce flex items-center space-x-2 border border-white/15">
          <span>{toast}</span>
        </div>
      )}

      {/* Navigation bar */}
      <BottomNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={currentUser.isAdmin}
        unreadNotifications={unreadNotifications}
        onOpenNotifications={() => {
          setShowNotifications(true);
          markNotificationsAsRead(currentUser.id);
        }}
        userAvatar={currentUser.avatarUrl}
      />

      {/* MAIN VIEWPORT BODY */}
      <main className="pb-24 relative z-10">
        
        {/* 1. HOME TAB VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-8 pt-20 md:pt-28 animate-fadeIn">
            {/* Sub-tab selection for Home page */}
            {currentUser && (
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl w-full max-w-md mx-auto sm:mx-0 backdrop-blur-xl">
                  <button
                    onClick={() => setHomeSubTab('featured')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
                      homeSubTab === 'featured'
                        ? 'bg-[#F5C518] text-black font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Featured Cinema</span>
                  </button>
                  <button
                    onClick={() => setHomeSubTab('personalized')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
                      homeSubTab === 'personalized'
                        ? 'bg-[#F5C518] text-black font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Personal Discovery</span>
                  </button>
                </div>
              </div>
            )}

            {homeSubTab === 'personalized' && currentUser ? (
              <PersonalizedHomeFeed
                currentUser={currentUser}
                allMovies={allMovies}
                allReviews={allReviews}
                usersList={usersList}
                followsList={getFollowsList()}
                onMovieClick={handleMovieClick}
                onQuickWatchlist={handleQuickWatchlist}
                onQuickRate={(movieId, rating) => handleQuickRate({ stopPropagation: () => {} } as any, movieId, rating)}
              />
            ) : (
              <div className="space-y-12">
                {/* General Carousels Container */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                  
                  {loadingHomeContent ? (
                    /* Dynamic Skeleton Loading State */
                    <div className="space-y-10 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-4">
                          <div className="h-8 bg-[#181818] rounded-xl w-64" />
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5].map(j => (
                              <div key={j} className="h-[300px] bg-[#111111] rounded-[2rem] border border-white/5" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Immersive Hero cinematic spotlight */}
                      {(() => {
                        const heroMovie = homeSpotlightMovies[0] || {
                          id: 'm_1',
                          title: 'Dune: Part Two',
                          overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Experience Denis Villeneuve's masterpiece.",
                          backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
                          genres: ['Sci-Fi', 'Adventure'],
                          isTvShow: false,
                          releaseDate: '2024-03-01'
                        };
                        return (
                          <div className="relative h-[380px] md:h-[580px] max-w-7xl mx-auto rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-zinc-950">
                            <div className="absolute inset-0 z-0">
                              <img
                                src={heroMovie.backdropPath || "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80"}
                                alt={heroMovie.title}
                                className="w-full h-full object-cover opacity-60 transition-transform duration-1000 ease-out hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/65 to-transparent" />
                            </div>

                            <div className="absolute bottom-10 left-6 md:left-14 max-w-2xl space-y-4 z-10">
                              <div className="flex gap-2">
                                <span className="px-4 py-1.5 bg-[#F5C518] text-black text-[9px] font-black rounded-full uppercase tracking-widest font-mono shadow-lg shadow-[#F5C518]/20">
                                  Featured Spotlight
                                </span>
                                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white text-[9px] font-black rounded-full uppercase tracking-widest font-mono border border-white/10">
                                  {heroMovie.genres && heroMovie.genres.length > 0 ? heroMovie.genres.slice(0, 2).join(' / ') : 'Movie Blockbuster'}
                                </span>
                              </div>
                              <h1 className="text-4xl md:text-7xl font-sans font-black tracking-tighter text-white uppercase leading-none">
                                {heroMovie.title}
                              </h1>
                              <p className="text-zinc-300 text-xs md:text-sm leading-relaxed line-clamp-3 font-medium">
                                {heroMovie.overview}
                              </p>
                              <div className="flex gap-3 pt-3">
                                <button
                                  onClick={() => handleMovieClick(heroMovie.id, !!heroMovie.isTvShow)}
                                  className="px-8 py-3.5 bg-white text-black hover:bg-[#F5C518] font-bold text-xs rounded-xl transition duration-300 tracking-widest uppercase flex items-center space-x-1.5 shadow-lg shadow-white/5 cursor-pointer hover:scale-105"
                                >
                                  <span>View Specifications</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleQuickWatchlist(e, heroMovie)}
                                  className="px-8 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/15 font-bold text-xs rounded-xl transition duration-300 tracking-widest uppercase cursor-pointer hover:scale-105"
                                >
                                  + Quick Add
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* World & Hollywood Blockbusters Carousel */}
                      {homeWorldMovies.length > 0 && (
                        <div className="pt-6">
                          <HorizontalCarousel
                            title="World & Hollywood Blockbusters"
                            icon={<Globe className="w-5.5 h-5.5 text-[#F5C518]" />}
                            items={homeWorldMovies}
                            onItemClick={(movie) => handleMovieClick(movie.id, !!movie.isTvShow)}
                            onQuickWatchlist={handleQuickWatchlist}
                            onQuickRate={handleQuickRate}
                            currentUserId={currentUser ? currentUser.id : ''}
                          />
                        </div>
                      )}

                      {/* Indian Cinema Carousel */}
                      {homeIndianMovies.length > 0 && (
                        <HorizontalCarousel
                          title="Indian Cinema"
                          icon={<Sparkles className="w-5.5 h-5.5 text-[#F5C518]" />}
                          items={homeIndianMovies}
                          onItemClick={(movie) => handleMovieClick(movie.id, !!movie.isTvShow)}
                          onQuickWatchlist={handleQuickWatchlist}
                          onQuickRate={handleQuickRate}
                          currentUserId={currentUser ? currentUser.id : ''}
                        />
                      )}

                      {/* Trending TV Shows Carousel */}
                      {homeTVShows.length > 0 && (
                        <HorizontalCarousel
                          title="Trending TV Shows"
                          icon={<Tv className="w-5.5 h-5.5 text-[#F5C518]" />}
                          items={homeTVShows}
                          onItemClick={(movie) => handleMovieClick(movie.id, !!movie.isTvShow)}
                          onQuickWatchlist={handleQuickWatchlist}
                          onQuickRate={handleQuickRate}
                          currentUserId={currentUser ? currentUser.id : ''}
                        />
                      )}

                      {/* Top Rated Masterpieces Carousel */}
                      {homeSpotlightMovies.length > 0 && (
                        <HorizontalCarousel
                          title="Critically Acclaimed Masterpieces"
                          icon={<Flame className="w-5.5 h-5.5 text-[#F5C518]" />}
                          items={homeSpotlightMovies}
                          onItemClick={(movie) => handleMovieClick(movie.id, !!movie.isTvShow)}
                          onQuickWatchlist={handleQuickWatchlist}
                          onQuickRate={handleQuickRate}
                          currentUserId={currentUser ? currentUser.id : ''}
                        />
                      )}
                    </>
                  )}

                  {/* Grid: Community Reviews + Friends Activity Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Community reviews */}
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-2xl font-sans font-black tracking-tight text-white uppercase">Community Critic Logs</h3>
                      <div className="space-y-4">
                        {allReviews.slice(0, 3).map(rev => (
                          <div key={rev.id} className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-[#F5C518]/30 transition-all duration-300 shadow-md">
                            <div className="flex justify-between">
                              <div className="flex items-center space-x-3">
                                <img src={rev.userAvatar} alt={rev.username} className="w-9 h-9 rounded-full object-cover cursor-pointer border border-[#F5C518]/30 hover:scale-105 transition" onClick={() => handleOpenUserOverlay(rev.username)} />
                                <div>
                                  <span className="font-black text-xs text-white hover:text-[#F5C518] cursor-pointer block" onClick={() => handleOpenUserOverlay(rev.username)}>
                                    @{rev.username}
                                  </span>
                                  <p className="text-[10px] text-zinc-500 font-mono font-semibold uppercase">Logged notes for {rev.movieTitle}</p>
                                </div>
                              </div>
                              <div className="flex items-center text-[#F5C518] text-xs font-mono font-bold bg-white/5 px-2.5 py-1 rounded-xl">
                                <Star className="w-3.5 h-3.5 fill-current mr-1 text-[#F5C518]" />
                                <span>{rev.rating}</span>
                              </div>
                            </div>
                            <h4 className="font-black text-white text-sm">{rev.title}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{rev.body}</p>
                            <button onClick={() => handleMovieClick(rev.movieId, rev.isTvShow)} className="text-[10px] text-[#F5C518] font-black uppercase tracking-wider hover:underline block cursor-pointer">
                              Read Full Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Friends Activity Panel */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-sans font-black tracking-tight text-white uppercase">Friends Network</h3>
                      <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] text-center space-y-4 shadow-md">
                        <Users className="w-8 h-8 mx-auto text-zinc-500" />
                        <div className="space-y-1">
                          <p className="text-sm font-black text-white">Sync your network feed</p>
                          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                            Follow film lovers inside Profile settings to monitor what they watch, rate, and review.
                          </p>
                        </div>
                        
                        {/* Simulated live community recommendation profiles */}
                        <div className="pt-3 divide-y divide-white/5 text-left text-xs">
                          {usersList.filter(u => currentUser ? u.id !== currentUser.id : true).slice(0, 3).map(u => (
                            <div key={u.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                              <div className="flex items-center space-x-2.5">
                                <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover border border-white/5" />
                                <span className="font-bold text-zinc-300">@{u.username}</span>
                              </div>
                              <button
                                onClick={() => handleOpenUserOverlay(u.username)}
                                className="text-[10px] text-[#F5C518] font-black uppercase tracking-wider hover:underline cursor-pointer"
                              >
                                View Bio
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. EXPLORE TAB VIEW (Bento Layout) */}
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28 space-y-10 animate-fadeIn">
            
            {/* Title */}
            <div>
              <h1 className="text-3xl font-sans font-black tracking-tight text-white">Explore Cinematic Space</h1>
              <p className="text-zinc-400 text-xs md:text-sm font-medium">Filter genres, read system bulletins, and find your next visual masterpiece.</p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Genres Spotlights */}
              <div className="md:col-span-2 bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-xl">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#F5C518] flex items-center space-x-2">
                  <Compass className="w-5 h-5" />
                  <span>Cinematic Genre Directories</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium">Click any genre to auto-filter specifications in search panels.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Animation', 'Mystery', 'Romance', 'Horror'].map((genre) => (
                    <div
                      key={genre}
                      onClick={() => {
                        setSearchGenre(genre);
                        setActiveTab('search');
                      }}
                      className="p-4 bg-[#1A1A1A] border border-white/5 rounded-2xl hover:border-[#F5C518]/30 hover:bg-[#1A1A1A]/70 cursor-pointer transition-all duration-300"
                    >
                      <h4 className="font-bold text-sm text-white">{genre}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 font-bold uppercase">Explore Film list</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Real Bulletins / Announcements */}
              <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-xl">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#F5C518] flex items-center space-x-2">
                  <Bell className="w-4.5 h-4.5" />
                  <span>System Bulletins</span>
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-1 bg-[#F5C518] text-black text-[8px] font-black rounded-full font-mono uppercase tracking-wider">
                          {ann.badge || 'BULLETIN'}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold">{ann.createdAt}</span>
                      </div>
                      <h4 className="font-black text-white text-xs">{ann.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Streaming Platform quick filters */}
              <div className="md:col-span-3 bg-[#111111]/90 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-xl">
                <h3 className="font-black text-sm uppercase tracking-wider text-white">Filter by Streaming Provider in Your Country</h3>
                <div className="flex flex-wrap gap-3">
                  {availableProviders.slice(0, 12).map(platform => (
                    <div
                      key={platform}
                      onClick={() => {
                        setSearchPlatform(platform);
                        setActiveTab('search');
                      }}
                      className="bg-[#1A1A1A] p-4 border border-white/5 rounded-2xl cursor-pointer hover:border-[#F5C518]/30 hover:bg-[#1A1A1A]/70 transition-all duration-300 flex items-center space-x-3.5 grow shrink-0 min-w-[160px]"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#F5C518]/10 flex items-center justify-center font-black text-[#F5C518] font-mono text-sm shadow-inner">
                        {platform[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{platform}</h4>
                        <p className="text-[9px] text-zinc-500 font-mono font-bold uppercase">Filter lists</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 3. SEARCH TAB VIEW */}
        {activeTab === 'search' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28 space-y-8 animate-fadeIn">
            
            {/* Header / query Input */}
            <div className="space-y-4">
              <h1 className="text-3xl font-sans font-black tracking-tight text-white uppercase">Registry Search</h1>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query movies, TV shows, cast, directors..."
                  className="w-full bg-[#111111]/90 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-[#F5C518] outline-none shadow-xl transition-all duration-300"
                />
              </div>
            </div>

            {/* Filter Hub specification block */}
            <div className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#F5C518]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-[#F5C518]/10 text-[#F5C518] rounded-xl">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Dynamic Specification Filters</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Real-time localized availability routing</p>
                  </div>
                </div>
                
                {/* Reset button inside header */}
                {(searchGenre || searchYear || searchLanguage || searchPlatform || searchCountry !== 'US') && (
                  <button
                    onClick={() => {
                      setSearchGenre('');
                      setSearchYear('');
                      setSearchLanguage('');
                      setSearchPlatform('');
                      setSearchQuery('');
                      setSearchCountry('US');
                    }}
                    className="px-3.5 py-1.5 bg-[#1C1C1C] border border-white/5 hover:border-[#F5C518] text-[#F5C518] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition duration-300 cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs text-zinc-400">
                
                {/* Genres filter */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-zinc-500 text-[10px]">Genre Spec</label>
                  <select
                    value={searchGenre}
                    onChange={e => setSearchGenre(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 hover:border-white/20 rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/60 text-xs"
                  >
                    <option value="">All Genres</option>
                    {['Action', 'Adventure', 'Animation', 'Comedy', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Release Year filter */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-zinc-500 text-[10px] flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-[#F5C518]" />
                    <span>Release Year</span>
                  </label>
                  <select
                    value={searchYear}
                    onChange={e => setSearchYear(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 hover:border-white/20 rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/60 text-xs"
                  >
                    <option value="">All Years</option>
                    {ALL_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Language filter */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-zinc-500 text-[10px]">Language</label>
                  <select
                    value={searchLanguage}
                    onChange={e => setSearchLanguage(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 hover:border-white/20 rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/60 text-xs"
                  >
                    <option value="">All Languages</option>
                    {ALL_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Localized Country Provider Availability */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-[#F5C518] text-[10px] flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Country (Region)</span>
                  </label>
                  <select
                    value={searchCountry}
                    onChange={e => setSearchCountry(e.target.value)}
                    className="w-full bg-[#181818] border border-dashed border-[#F5C518]/30 hover:border-[#F5C518] rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518] text-xs font-bold"
                  >
                    {dynamicCountries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Streaming provider */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-zinc-500 text-[10px]">Streaming Platform</label>
                  <select
                    value={searchPlatform}
                    onChange={e => setSearchPlatform(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 hover:border-white/20 rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/60 text-xs"
                  >
                    <option value="">All Platforms</option>
                    {availableProviders.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Sorter */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-widest font-mono block text-zinc-500 text-[10px]">Sort Index</label>
                  <select
                    value={searchSort}
                    onChange={e => setSearchSort(e.target.value)}
                    className="w-full bg-[#181818] border border-white/5 hover:border-white/20 rounded-xl p-3 text-white outline-none cursor-pointer transition focus:border-[#F5C518]/60 focus:ring-1 focus:ring-[#F5C518]/60 text-xs"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="rating">Average Rating</option>
                    <option value="newest">Newest Releases</option>
                    <option value="oldest">Oldest Catalog</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Results Grid */}
            {filteredSearchMovies.length === 0 && !isSearchingTmdb ? (
              <div className="text-center py-16 bg-[#111111]/60 border border-white/5 rounded-[2rem] p-8 space-y-4">
                <p className="text-zinc-500 italic font-medium">
                  No matching catalog entries found in currently loaded list. Expand filters or try loading more.
                </p>
                {hasMoreSearch && (
                  <button
                    onClick={() => setSearchPage(prev => prev + 1)}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-[#F5C518] font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition"
                  >
                    Load More Titles from Catalog
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                  {filteredSearchMovies.map(movie => (
                    <MovieShowcaseCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => handleMovieClick(movie.id, !!movie.isTvShow)}
                      onQuickWatchlist={(e) => handleQuickWatchlist(e, movie)}
                      onQuickRate={(e, score) => handleQuickRate(e, movie.id, score)}
                      currentUserId={currentUser.id}
                    />
                  ))}
                </div>

                {/* Loading indicator at bottom of search results */}
                {isSearchingTmdb && (
                  <div className="py-6 flex justify-center items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Scanning streaming catalog space...</p>
                    </div>
                  </div>
                )}

                {/* Load More Button */}
                {hasMoreSearch && !isSearchingTmdb && (
                  <div className="py-6 flex justify-center">
                    <button
                      onClick={() => setSearchPage(prev => prev + 1)}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#F5C518]/10 to-[#F5C518]/20 border border-[#F5C518]/30 hover:border-[#F5C518] hover:from-[#F5C518]/20 hover:to-[#F5C518]/30 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition duration-300 shadow-lg flex items-center gap-3"
                    >
                      <span>Load More Titles</span>
                      <span className="text-[10px] bg-zinc-800 text-[#F5C518] px-2 py-0.5 rounded-full font-bold">Page {searchPage}</span>
                    </button>
                  </div>
                )}

                {/* End of content indicator */}
                {!hasMoreSearch && filteredSearchMovies.length > 0 && (
                  <div className="py-8 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    🌌 Cinematic Catalog end reached
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 4. WATCHLIST TAB VIEW */}
        {activeTab === 'watchlist' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28 space-y-8 animate-fadeIn">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-sans font-black tracking-tight text-white uppercase">Your Film Watchlists</h1>
                <p className="text-zinc-400 text-xs md:text-sm font-medium">Manage planning lists, active statuses, or build your own public and private themed playlists.</p>
              </div>

              {/* Master Mode Toggles */}
              <div className="flex bg-[#111111]/90 border border-white/5 p-1 rounded-2xl shrink-0 self-start">
                <button
                  onClick={() => { setWatchlistType('standard'); setSelectedCustomWatchlistId(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    watchlistType === 'standard'
                      ? 'bg-[#F5C518] text-black font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  📁 Standard Statuses
                </button>
                <button
                  onClick={() => setWatchlistType('custom')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    watchlistType === 'custom'
                      ? 'bg-[#F5C518] text-black font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🎬 Custom Playlists
                </button>
              </div>
            </div>

            {watchlistType === 'standard' ? (
              <>
                {/* Query filter / status tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Watch status filter Tabs */}
                  <div className="md:col-span-2 flex border-b border-white/5 space-x-6">
                    {(['Plan to Watch', 'Watching', 'Completed', 'Favorites'] as WatchlistStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setWatchlistFilter(status)}
                        className={`pb-3.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                          watchlistFilter === status
                            ? 'text-[#F5C518] border-b-2 border-[#F5C518] font-black'
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Query filter inside watchlist */}
                  <input
                    type="text"
                    value={watchlistQuery}
                    onChange={e => setWatchlistQuery(e.target.value)}
                    placeholder="Search inside current list..."
                    className="bg-[#111111]/90 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-[#F5C518] shadow-md transition-all duration-300"
                  />

                </div>

                {/* Grid of Watchlist Items */}
                {myWatchlistItems.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] text-zinc-500 italic text-sm bg-[#111111]/40">
                    No films under "{watchlistFilter}" watchlist currently. Explore titles to add items!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                    {myWatchlistItems.map(item => {
                      const actualMovie = allMovies.find(m => m.id === item.movieId);
                      if (!actualMovie) return null;
                      return (
                        <MovieShowcaseCard
                          key={item.movieId}
                          movie={actualMovie}
                          onClick={() => handleMovieClick(item.movieId, item.isTvShow)}
                          onQuickWatchlist={(e) => handleQuickWatchlist(e, actualMovie)}
                          onQuickRate={(e, score) => handleQuickRate(e, item.movieId, score)}
                          currentUserId={currentUser.id}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              // CUSTOM WATCHLISTS WORKSPACE
              <div className="space-y-6">
                {selectedCustomWatchlistId === null ? (
                  <>
                    {/* Top actions bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <input
                        type="text"
                        value={watchlistQuery}
                        onChange={e => setWatchlistQuery(e.target.value)}
                        placeholder="Search playlists..."
                        className="bg-[#111111]/90 border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#F5C518] shadow-md transition-all duration-300 w-full sm:max-w-xs"
                      />
                      
                      <button
                        onClick={() => {
                          setShowCreateWatchlistModal(!showCreateWatchlistModal);
                          setEditingWatchlistId(null);
                        }}
                        className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer flex items-center space-x-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Custom Playlist</span>
                      </button>
                    </div>

                    {/* Inline Create Form */}
                    {showCreateWatchlistModal && (
                      <div className="bg-[#111111]/80 border border-white/10 p-6 rounded-[2rem] space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <h3 className="font-sans font-black text-sm text-[#F5C518] uppercase tracking-wider">New Custom Playlist Setup</h3>
                          <button onClick={() => setShowCreateWatchlistModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Playlist Name</label>
                            <input
                              type="text"
                              value={newWlName}
                              onChange={e => setNewWlName(e.target.value)}
                              placeholder="e.g. Christopher Nolan Marathon..."
                              className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-[#F5C518]"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Visibility Privacy</label>
                            <div className="flex space-x-4 pt-1">
                              <button
                                type="button"
                                onClick={() => setNewWlIsPrivate(false)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 border ${
                                  !newWlIsPrivate
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 font-black'
                                    : 'bg-zinc-950 border-white/5 text-zinc-500'
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Public</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewWlIsPrivate(true)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 border ${
                                  newWlIsPrivate
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30 font-black'
                                    : 'bg-zinc-950 border-white/5 text-zinc-500'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>Private</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Playlist Description</label>
                          <textarea
                            value={newWlDesc}
                            onChange={e => setNewWlDesc(e.target.value)}
                            placeholder="Describe the cinematic theme of this custom watchlist..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-[#F5C518] leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowCreateWatchlistModal(false)}
                            className="px-4 py-2 border border-white/5 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer text-xs uppercase font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newWlName.trim()) return;
                              await createCustomWatchlist(currentUser.id, newWlName.trim(), newWlDesc.trim(), newWlIsPrivate);
                              setNewWlName('');
                              setNewWlDesc('');
                              setNewWlIsPrivate(false);
                              setShowCreateWatchlistModal(false);
                              setCustomWatchlists(getCustomWatchlists());
                              triggerToast('Custom playlist established!');
                            }}
                            className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black px-5 py-2 rounded-xl font-bold transition cursor-pointer text-xs uppercase"
                          >
                            Create Watchlist
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Edit Form */}
                    {editingWatchlistId !== null && (
                      <div className="bg-[#111111]/80 border border-white/10 p-6 rounded-[2rem] space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <h3 className="font-sans font-black text-sm text-[#F5C518] uppercase tracking-wider">Edit Playlist Details</h3>
                          <button onClick={() => setEditingWatchlistId(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Playlist Name</label>
                            <input
                              type="text"
                              value={editWlName}
                              onChange={e => setEditWlName(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-[#F5C518]"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Visibility Privacy</label>
                            <div className="flex space-x-4 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditWlIsPrivate(false)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 border ${
                                  !editWlIsPrivate
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 font-black'
                                    : 'bg-zinc-950 border-white/5 text-zinc-500'
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Public</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditWlIsPrivate(true)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 border ${
                                  editWlIsPrivate
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30 font-black'
                                    : 'bg-zinc-950 border-white/5 text-zinc-500'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>Private</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-zinc-400 text-[10px] font-bold uppercase mb-1">Playlist Description</label>
                          <textarea
                            value={editWlDesc}
                            onChange={e => setEditWlDesc(e.target.value)}
                            rows={3}
                            className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-white text-xs outline-none focus:border-[#F5C518] leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setEditingWatchlistId(null)}
                            className="px-4 py-2 border border-white/5 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer text-xs uppercase font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!editWlName.trim()) return;
                              await updateCustomWatchlist(editingWatchlistId, {
                                name: editWlName.trim(),
                                description: editWlDesc.trim(),
                                isPrivate: editWlIsPrivate
                              });
                              setEditingWatchlistId(null);
                              setCustomWatchlists(getCustomWatchlists());
                              triggerToast('Playlist specifications updated!');
                            }}
                            className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black px-5 py-2 rounded-xl font-bold transition cursor-pointer text-xs uppercase"
                          >
                            Save Specifications
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Playlist items grid */}
                    {myCustomWatchlists.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] text-zinc-500 italic text-sm bg-[#111111]/40">
                        No custom playlists found. Launch a themed list to organize custom movie stacks!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myCustomWatchlists.map(wl => (
                          <div
                            key={wl.id}
                            className="bg-[#111111]/90 border border-white/5 p-6 rounded-[2.2rem] flex flex-col justify-between space-y-4 hover:border-white/10 hover:bg-[#1A1A1A] transition duration-300 shadow-xl"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase flex items-center space-x-1 ${
                                  wl.isPrivate
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                }`}>
                                  {wl.isPrivate ? (
                                    <>
                                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1"></span>
                                      <span>Private List</span>
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="w-2.5 h-2.5 text-green-400 mr-1" />
                                      <span>Public Stack</span>
                                    </>
                                  )}
                                </span>
                                
                                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                                  {wl.movieIds.length} {wl.movieIds.length === 1 ? 'Title' : 'Titles'}
                                </span>
                              </div>

                              <h3 className="text-lg font-sans font-black text-white leading-snug truncate">
                                {wl.name}
                              </h3>
                              
                              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 h-10">
                                {wl.description || 'No description provided for this collection.'}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                              <button
                                onClick={() => setSelectedCustomWatchlistId(wl.id)}
                                className="flex-1 bg-white/5 hover:bg-[#F5C518] hover:text-black text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer text-center"
                              >
                                View Titles
                              </button>
                              
                              <button
                                onClick={() => {
                                  setEditingWatchlistId(wl.id);
                                  setEditWlName(wl.name);
                                  setEditWlDesc(wl.description);
                                  setEditWlIsPrivate(wl.isPrivate);
                                  setShowCreateWatchlistModal(false);
                                }}
                                className="p-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
                                title="Edit specs"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${wl.name}"?`)) {
                                    await deleteCustomWatchlist(wl.id);
                                    setCustomWatchlists(getCustomWatchlists());
                                    triggerToast(`Deleted custom playlist.`);
                                  }
                                }}
                                className="p-2.5 bg-zinc-900 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-xs transition cursor-pointer"
                                title="Delete list"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // EXPANDED CUSTOM PLAYLIST DETAILS VIEW
                  <div className="space-y-6">
                    {(() => {
                      const wl = customWatchlists.find(c => c.id === selectedCustomWatchlistId);
                      if (!wl) return null;
                      return (
                        <div className="space-y-6">
                          {/* Top navigation */}
                          <button
                            onClick={() => setSelectedCustomWatchlistId(null)}
                            className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-[#F5C518] transition cursor-pointer flex items-center space-x-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Return to Playlists</span>
                          </button>

                          {/* Playlist header specs */}
                          <div className="bg-[#111111]/70 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h2 className="text-2xl font-sans font-black tracking-tight text-white uppercase">{wl.name}</h2>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                                wl.isPrivate
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
                              }`}>
                                {wl.isPrivate ? 'Private Playlist' : 'Public Playlist'}
                              </span>
                            </div>
                            
                            {wl.description && (
                              <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5 max-w-3xl">
                                {wl.description}
                              </p>
                            )}
                            
                            <p className="text-[10px] text-zinc-500 font-mono font-semibold uppercase">
                              Created on {new Date(wl.createdAt).toLocaleDateString()} • {wl.movieIds.length} {wl.movieIds.length === 1 ? 'Title' : 'Titles'}
                            </p>
                          </div>

                          {/* Titles list */}
                          {wl.movieIds.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-white/5 rounded-[2rem] text-zinc-500 italic text-sm bg-[#111111]/40">
                              This playlist is empty. View movies or TV shows and use the details sidebar to stack items here!
                            </div>
                          ) : selectedCustomWlMovies.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 animate-pulse">
                              Resolving cinematic titles in custom checklist...
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                              {selectedCustomWlMovies.map(movie => (
                                <div key={movie.id} className="relative group">
                                  <MovieShowcaseCard
                                    movie={movie}
                                    onClick={() => handleMovieClick(movie.id, !!movie.isTvShow)}
                                    onQuickWatchlist={(e) => handleQuickWatchlist(e, movie)}
                                    onQuickRate={(e, score) => handleQuickRate(e, movie.id, score)}
                                    currentUserId={currentUser.id}
                                  />
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await removeMovieFromCustomWatchlist(wl.id, movie.id);
                                      triggerToast(`Removed "${movie.title}" from watchlist`);
                                      setCustomWatchlists(getCustomWatchlists());
                                    }}
                                    className="absolute bottom-4 right-4 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-lg cursor-pointer text-xs font-mono font-bold flex items-center space-x-1 border border-red-500/30 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-300"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 5. USER PROFILE & SETTINGS TAB VIEW */}
        {activeTab === 'profile' && (
          <ProfileTab
            onLogout={handleLogout}
            onMovieClick={handleMovieClick}
            allMovies={allMovies}
          />
        )}

        {/* 6. ADMIN CONTROL VIEW */}
        {activeTab === 'admin' && (
          <AdminPanel
            onMovieClick={handleMovieClick}
            usersList={usersList}
            onUpdateUsersList={handleUpdateUsersList}
          />
        )}

      </main>

      {/* MODAL: MOVIE DETAILS OVERLAY */}
      {selectedMovieId && (
        <MovieDetails
          movieId={selectedMovieId}
          isTv={selectedMovieIsTv}
          userId={currentUser.id}
          countryCode={searchCountry}
          onClose={() => {
            setSelectedMovieId(null);
            loadAllMedia();
          }}
          onMovieClick={handleMovieClick}
          allMovies={allMovies}
        />
      )}

      {/* MODAL: NOTIFICATIONS CENTER TOP DROPDOWN */}
      {showNotifications && (
        <div 
          onClick={() => {
            setShowNotifications(false);
            loadAllMedia();
          }}
          className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-24 px-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111111]/95 backdrop-blur-2xl border border-white/10 w-full max-w-lg rounded-[2rem] p-6 space-y-4 shadow-2xl animate-fadeIn flex flex-col max-h-[75vh]"
          >
            
            <div className="flex justify-between items-center border-b border-white/5 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-5 h-5 text-[#F5C518] animate-pulse" />
                <h2 className="text-md font-sans font-black tracking-tight text-white uppercase">Notification Center</h2>
              </div>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  loadAllMedia();
                }}
                className="p-1.5 hover:text-[#F5C518] hover:bg-white/5 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {getNotifications(currentUser.id).length === 0 ? (
                <div className="text-center py-12 text-zinc-500 italic text-xs font-medium">
                  No notifications recorded. Log review comments, follow users, or like reviews to see updates!
                </div>
              ) : (
                getNotifications(currentUser.id).map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.targetId) {
                        handleMovieClick(notif.targetId, false);
                      }
                      setShowNotifications(false);
                    }}
                    className="flex space-x-3.5 bg-[#1A1A1A] p-3.5 border border-white/5 rounded-2xl hover:border-[#F5C518]/30 cursor-pointer transition-all text-xs leading-normal shadow-md"
                  >
                    <img src={notif.senderAvatar} alt={notif.senderName} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/5" />
                    <div>
                      <p className="text-zinc-300">
                        <span className="font-bold text-white">@{notif.senderName}</span> {notif.content}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-mono font-semibold uppercase mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OTHER MEMBER COMMUNITY PROFILE OVERLAY */}
      {selectedUserOverlay && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl animate-fadeIn">
            {/* Banner block */}
            <div className="relative h-32">
              <img src={selectedUserOverlay.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
              <button onClick={() => setSelectedUserOverlay(null)} className="absolute top-5 right-5 text-white hover:text-[#F5C518] transition cursor-pointer bg-black/50 p-2 rounded-full backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile specifications */}
            <div className="px-8 pb-8 relative -mt-10 space-y-5">
              <div className="flex items-end justify-between">
                <img src={selectedUserOverlay.avatarUrl} alt={selectedUserOverlay.displayName} className="w-22 h-22 rounded-full border-4 border-[#111111] object-cover shadow-xl" />
                
                {/* Follow trigger */}
                {selectedUserOverlay.id !== currentUser.id && (
                  <button
                    onClick={() => handleToggleFollowUser(selectedUserOverlay)}
                    className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                      isFollowing(currentUser.id, selectedUserOverlay.id)
                        ? 'bg-[#1A1A1A] border border-white/10 text-white'
                        : 'bg-[#F5C518] text-black hover:bg-[#F5C518]/90 shadow-lg shadow-[#F5C518]/15 hover:scale-105'
                    }`}
                  >
                    {isFollowing(currentUser.id, selectedUserOverlay.id) ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow user</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-sans font-black tracking-tight text-white">{selectedUserOverlay.displayName}</h3>
                <p className="text-xs text-zinc-500 font-mono font-bold">@{selectedUserOverlay.username}</p>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 font-medium">
                {selectedUserOverlay.bio || 'This cinephile hasn\'t set up a bio profile yet.'}
              </p>

              {/* Stats and genres */}
              <div className="flex justify-between items-center bg-[#1A1A1A] border border-white/5 p-4 rounded-2xl text-center text-xs font-mono">
                <div>
                  <p className="font-black text-white text-base">{selectedUserOverlay.followersCount}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-sans font-bold tracking-wider">Followers</p>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div>
                  <p className="font-black text-white text-base">{selectedUserOverlay.followingCount}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-sans font-bold tracking-wider">Following</p>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div>
                  <p className="font-black text-white text-base">
                    {getReviews().filter(r => r.userId === selectedUserOverlay.id).length}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-sans font-bold tracking-wider">Reviews</p>
                </div>
              </div>

              {selectedUserOverlay.favoriteGenres.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] text-gray-500 uppercase font-bold font-mono">Prefers</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedUserOverlay.favoriteGenres.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-zinc-950 text-[10px] border border-white/5 rounded text-gray-400">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Reusable showcase movie card sub-component
interface MovieShowcaseCardProps {
  key?: string | number;
  movie: Movie;
  onClick: () => void;
  onQuickWatchlist: (e: React.MouseEvent) => void;
  onQuickRate: (e: React.MouseEvent, score: number) => void;
  currentUserId: string;
}

function MovieShowcaseCard({
  movie,
  onClick,
  onQuickWatchlist,
  onQuickRate,
  currentUserId
}: MovieShowcaseCardProps) {
  const isCurrentlyInWatchlist = getWatchlist(currentUserId).some(w => w.movieId === movie.id);
  const existingRating = getUserRating(currentUserId, movie.id);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-[#111111]/90 border border-white/5 rounded-[2rem] overflow-hidden hover:border-[#F5C518]/30 hover:bg-[#1A1A1A] transition-all duration-500 relative flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
    >
      {/* Poster wrapper */}
      <div className="aspect-[2/3] w-full overflow-hidden relative border-b border-white/5 rounded-t-[2rem]">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Floating average rating badge */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-[10px] font-mono text-[#F5C518] font-black flex items-center shadow-lg">
          <Star className="w-3.5 h-3.5 fill-current mr-1 text-[#F5C518]" />
          {movie.communityRating}
        </div>

        {/* Quick Watchlist Bookmark button */}
        <button
          onClick={onQuickWatchlist}
          className={`absolute top-3 left-3 p-2.5 rounded-full transition-all duration-300 border backdrop-blur-md shadow-lg cursor-pointer ${
            isCurrentlyInWatchlist
              ? 'bg-[#F5C518] text-black border-[#F5C518] scale-105'
              : 'bg-black/80 text-white border-white/10 hover:bg-[#F5C518] hover:text-black hover:border-[#F5C518] hover:scale-105'
          }`}
          title={isCurrentlyInWatchlist ? 'Remove from Watchlist' : 'Plan to Watch'}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Hover Rate Slide Widget Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-[#090909]/95 backdrop-blur-md p-4 text-[10px] translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-out flex flex-col justify-center space-y-2 border-t border-white/5">
          <p className="text-zinc-400 text-center uppercase font-mono font-bold tracking-widest text-[9px]">Quick Rating</p>
          <div className="flex justify-between items-center space-x-1 pt-1">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                onClick={(e) => onQuickRate(e, score)}
                className={`flex-1 py-1.5 rounded-lg text-center transition font-black cursor-pointer text-[11px] ${
                  existingRating === score
                    ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-[#F5C518]/20 hover:text-[#F5C518]'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info contents */}
      <div className="p-4.5 flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <h4 className="font-sans font-black text-sm text-white truncate group-hover:text-[#F5C518] transition-colors duration-300 tracking-tight">
            {movie.title}
          </h4>
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 font-mono font-bold">
            <span>{movie.releaseDate.split('-')[0]}</span>
            <span>•</span>
            <span className="text-zinc-400 font-sans tracking-wider uppercase text-[9px] font-semibold">{movie.isTvShow ? 'TV Series' : 'Feature Film'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Horizontal Carousel for scrollable lists with Arrow buttons
interface HorizontalCarouselProps {
  title: string;
  icon: React.ReactNode;
  items: Movie[];
  onItemClick: (movie: Movie) => void;
  onQuickWatchlist: (e: React.MouseEvent, movie: Movie) => void;
  onQuickRate: (e: React.MouseEvent, movieId: string, score: number) => void;
  currentUserId: string;
}

function HorizontalCarousel({
  title,
  icon,
  items,
  onItemClick,
  onQuickWatchlist,
  onQuickRate,
  currentUserId
}: HorizontalCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4 relative group/carousel">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-sans font-black tracking-tight text-white flex items-center space-x-2.5 uppercase">
          {icon}
          <span>{title}</span>
        </h3>
        {/* Navigation Buttons on the top right */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-xl bg-[#111111]/90 hover:bg-[#1A1A1A] border border-white/5 hover:border-[#F5C518]/40 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-xl bg-[#111111]/90 hover:bg-[#1A1A1A] border border-white/5 hover:border-[#F5C518]/40 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map(movie => (
            <div key={movie.id} className="w-[190px] md:w-[230px] flex-shrink-0">
              <MovieShowcaseCard
                movie={movie}
                onClick={() => onItemClick(movie)}
                onQuickWatchlist={(e) => onQuickWatchlist(e, movie)}
                onQuickRate={(e, score) => onQuickRate(e, movie.id, score)}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

