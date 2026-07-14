import { Movie, TVShow, CastMember } from '../types';
import { MOCK_MOVIES } from '../data/mockData';

// TMDB API Client
const BASE_URL = 'https://api.themoviedb.org/3';

// Simple in-memory cache to optimize performance and respect rate limits
const cache = new Map<string, any>();

export function getTmdbApiKey(): string {
  return (import.meta as any).env.VITE_TMDB_API_KEY || localStorage.getItem('local_tmdb_key') || '';
}

export function setTmdbApiKey(key: string) {
  if (key) {
    localStorage.setItem('local_tmdb_key', key);
  } else {
    localStorage.removeItem('local_tmdb_key');
  }
}

async function fetchFromTmdb(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error('TMDB API Key not found');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...params,
  });

  const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;
  
  if (cache.has(url)) {
    return cache.get(url);
  }

  // Retry logic (up to 2 times on failures)
  let attempts = 0;
  while (attempts < 2) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      cache.set(url, data);
      return data;
    } catch (error) {
      attempts++;
      if (attempts >= 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Map TMDB raw movie to Rovix Movie
export function mapTmdbMovie(m: any, isTv: boolean = false): Movie {
  const releaseDate = m.release_date || m.first_air_date || '2024-01-01';

  return {
    id: String(m.id),
    title: m.title || m.name || 'Untitled Film',
    tagline: m.tagline || '',
    overview: m.overview || 'No description available.',
    backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=80',
    genres: m.genres ? m.genres.map((g: any) => g.name) : (m.genre_ids ? getGenreNames(m.genre_ids) : ['Drama']),
    runtime: m.runtime || (m.episode_run_time && m.episode_run_time[0]) || 120,
    releaseDate,
    language: m.original_language ? m.original_language.toUpperCase() : 'EN',
    country: m.production_countries && m.production_countries.length > 0 ? m.production_countries[0].name : 'United States',
    status: m.status || 'Released',
    budget: m.budget || 0,
    revenue: m.revenue || 0,
    director: 'Unknown Director', // will fill from credits
    cast: [], // will fill from credits
    productionCompanies: m.production_companies ? m.production_companies.map((pc: any) => pc.name) : [],
    trailerUrl: '', // will fill from videos
    gallery: [], // will fill from images
    streamingPlatforms: [],
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 7.0,
    communityRating: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 3.5, // map 0-10 to 0-5
    totalRatingsCount: m.vote_count || 100,
    isTvShow: isTv,
    seasons: m.number_of_seasons || undefined,
    episodes: m.number_of_episodes || undefined,
  };
}

// Convert genre_ids to names using TMDB catalog
export const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

function getGenreNames(ids: number[]): string[] {
  return ids.map(id => GENRE_MAP[id] || 'Other').filter(g => g !== 'Other');
}

// Public API Functions
export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb(`/trending/movie/${timeWindow}`, { page: String(page) });
    return data.results.map((m: any) => mapTmdbMovie(m, false));
  } catch (err) {
    console.warn('TMDB failing or not configured. Using fallback movies.', err);
    return MOCK_MOVIES.filter(m => !m.isTvShow);
  }
}

export async function getTrendingTVShows(timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb(`/trending/tv/${timeWindow}`, { page: String(page) });
    return data.results.map((m: any) => mapTmdbMovie(m, true));
  } catch (err) {
    console.warn('TMDB failing or not configured. Using fallback TV shows.', err);
    return MOCK_MOVIES.filter(m => !!m.isTvShow);
  }
}

export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb('/movie/popular', { page: String(page) });
    return data.results.map((m: any) => mapTmdbMovie(m, false));
  } catch (err) {
    return MOCK_MOVIES.filter(m => !m.isTvShow);
  }
}

export async function getPopularTVShows(page: number = 1): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb('/tv/popular', { page: String(page) });
    return data.results.map((m: any) => mapTmdbMovie(m, true));
  } catch (err) {
    return MOCK_MOVIES.filter(m => !!m.isTvShow);
  }
}

export async function getUpcomingMovies(): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb('/movie/upcoming');
    return data.results.map((m: any) => mapTmdbMovie(m, false));
  } catch (err) {
    return MOCK_MOVIES.filter(m => !m.isTvShow).slice(0, 3);
  }
}

export async function getNowPlayingMovies(): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb('/movie/now_playing');
    return data.results.map((m: any) => mapTmdbMovie(m, false));
  } catch (err) {
    return MOCK_MOVIES.filter(m => !m.isTvShow).slice(1, 4);
  }
}

export async function getTopRated(type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb(`/${type}/top_rated`);
    return data.results.map((m: any) => mapTmdbMovie(m, type === 'tv'));
  } catch (err) {
    return MOCK_MOVIES.filter(m => type === 'tv' ? !!m.isTvShow : !m.isTvShow);
  }
}

export async function searchTMDB(query: string, page: number = 1): Promise<any[]> {
  if (!query.trim()) return [];
  try {
    const data = await fetchFromTmdb('/search/multi', { query, page: String(page) });
    return data.results.map((item: any) => {
      if (item.media_type === 'person') {
        return {
          id: String(item.id),
          type: 'person',
          name: item.name,
          profileUrl: item.profile_path ? `https://image.tmdb.org/t/p/w185${item.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          knownFor: item.known_for ? item.known_for.map((m: any) => m.title || m.name).join(', ') : '',
        };
      } else {
        const isTv = item.media_type === 'tv';
        return {
          ...mapTmdbMovie(item, isTv),
          type: isTv ? 'tv' : 'movie',
        };
      }
    });
  } catch (err) {
    // Search fallback locally
    const lower = query.toLowerCase();
    const movieResults = MOCK_MOVIES.filter(
      m => m.title.toLowerCase().includes(lower) || m.overview.toLowerCase().includes(lower)
    ).map(m => ({ ...m, type: m.isTvShow ? 'tv' : 'movie' }));
    return movieResults;
  }
}

export async function discoverMedia(
  type: 'movie' | 'tv',
  params: Record<string, string> = {}
): Promise<Movie[]> {
  try {
    const data = await fetchFromTmdb(`/discover/${type}`, params);
    return data.results.map((m: any) => mapTmdbMovie(m, type === 'tv'));
  } catch (err) {
    console.warn(`Discover failed for ${type}`, err);
    return [];
  }
}

export async function getLocalizedDiscover(
  type: 'movie' | 'tv',
  countryCode: string,
  page: number = 1
): Promise<Movie[]> {
  const params: Record<string, string> = {
    page: String(page),
    sort_by: 'popularity.desc',
  };

  if (countryCode === 'IN') {
    params.with_origin_country = 'IN';
    params.with_original_language = 'hi|ta|te|ml|kn|pa|mr';
  } else if (countryCode === 'KR') {
    params.with_origin_country = 'KR';
    params.with_original_language = 'ko';
  } else if (countryCode === 'JP') {
    params.with_origin_country = 'JP';
    params.with_original_language = 'ja';
  } else if (countryCode === 'FR') {
    params.with_origin_country = 'FR';
    params.with_original_language = 'fr';
  } else if (countryCode === 'ES') {
    params.with_origin_country = 'ES';
    params.with_original_language = 'es';
  } else if (countryCode === 'IT') {
    params.with_origin_country = 'IT';
    params.with_original_language = 'it';
  } else if (countryCode === 'DE') {
    params.with_origin_country = 'DE';
    params.with_original_language = 'de';
  } else if (countryCode === 'BR') {
    params.with_origin_country = 'BR';
    params.with_original_language = 'pt';
  } else if (['US', 'GB', 'CA', 'AU'].includes(countryCode)) {
    params.with_origin_country = countryCode;
  }

  return discoverMedia(type, params);
}

export async function getMovieDetails(id: string, isTvShow: boolean = false, countryCode: string = 'US'): Promise<Movie> {
  try {
    const endpoint = isTvShow ? `/tv/${id}` : `/movie/${id}`;
    const details = await fetchFromTmdb(endpoint);
    const movie = mapTmdbMovie(details, isTvShow);

    // Fetch external IDs to retrieve imdb_id
    try {
      const externalIds = await fetchFromTmdb(`${endpoint}/external_ids`);
      if (externalIds && externalIds.imdb_id) {
        movie.imdbId = externalIds.imdb_id;
      } else if (details.imdb_id) {
        movie.imdbId = details.imdb_id;
      }
    } catch (e) {
      if (details.imdb_id) {
        movie.imdbId = details.imdb_id;
      }
    }

    // Fetch credits (cast & crew)
    try {
      const credits = await fetchFromTmdb(`${endpoint}/credits`);
      if (credits) {
        // Find director
        const directorObj = credits.crew?.find((c: any) => c.job === 'Director');
        if (directorObj) {
          movie.director = directorObj.name;
        }

        // Map cast members
        movie.cast = (credits.cast || []).slice(0, 10).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          character: c.character,
          profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          popularity: c.popularity || 0,
        }));
      }
    } catch (e) {
      console.warn('Failed to load TMDB credits', e);
    }

    // Fetch videos (trailers)
    try {
      const videos = await fetchFromTmdb(`${endpoint}/videos`);
      if (videos && videos.results) {
        // Sort: Official Trailer -> Trailer -> Teaser -> Clip
        const sorted = [...videos.results].sort((a: any, b: any) => {
          const rank = (type: string, name: string) => {
            const lowerName = name.toLowerCase();
            const lowerType = type.toLowerCase();
            if (lowerType === 'trailer' && lowerName.includes('official')) return 1;
            if (lowerType === 'trailer') return 2;
            if (lowerType === 'teaser') return 3;
            return 4;
          };
          return rank(a.type, a.name) - rank(b.type, b.name);
        });
        const youtubeTrailer = sorted.find((v: any) => v.site === 'YouTube');
        if (youtubeTrailer) {
          movie.trailerUrl = `https://www.youtube.com/embed/${youtubeTrailer.key}`;
        }
      }
    } catch (e) {
      console.warn('Failed to load TMDB videos', e);
    }

    // Fetch images (backdrops and posters for gallery)
    try {
      const images = await fetchFromTmdb(`${endpoint}/images`, { include_image_language: 'en,null' });
      if (images) {
        const backdrops = (images.backdrops || []).slice(0, 6).map((img: any) => `https://image.tmdb.org/t/p/original${img.file_path}`);
        const posters = (images.posters || []).slice(0, 4).map((img: any) => `https://image.tmdb.org/t/p/w500${img.file_path}`);
        movie.gallery = [...backdrops, ...posters];
      }
    } catch (e) {
      movie.gallery = [movie.backdropUrl, movie.posterUrl];
    }

    // Fetch streaming providers
    try {
      const providers = await fetchFromTmdb(`${endpoint}/watch/providers`);
      if (providers && providers.results) {
        const localeData = providers.results[countryCode];
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
        movie.streamingPlatforms = Array.from(new Set(list));
        movie.rawProviders = providers.results;
      } else {
        movie.streamingPlatforms = [];
      }
    } catch (e) {
      console.warn('Failed to load streaming providers', e);
      movie.streamingPlatforms = [];
    }

    return movie;
  } catch (err) {
    // Fallback to local search
    const local = MOCK_MOVIES.find(m => m.id === id);
    if (local) return local;
    throw err;
  }
}

export async function getWatchProviders(id: string, isTvShow: boolean = false): Promise<any> {
  try {
    const endpoint = isTvShow ? `/tv/${id}/watch/providers` : `/movie/${id}/watch/providers`;
    const data = await fetchFromTmdb(endpoint);
    return data?.results || null;
  } catch (err) {
    return null;
  }
}

export async function getNetflixIdFromTmdbOrImdb(tmdbId: string, imdbId?: string, isTv: boolean = false): Promise<string | null> {
  try {
    let sparql = '';
    if (imdbId) {
      sparql = `SELECT ?netflixID WHERE {
        ?item wdt:P345 "${imdbId}".
        ?item wdt:P1874 ?netflixID.
      } LIMIT 1`;
    } else {
      const tmdbProp = isTv ? 'P4874' : 'P3047';
      sparql = `SELECT ?netflixID WHERE {
        ?item wdt:${tmdbProp} "${tmdbId}".
        ?item wdt:P1874 ?netflixID.
      } LIMIT 1`;
    }
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const bindings = data?.results?.bindings;
    if (bindings && bindings.length > 0) {
      return bindings[0].netflixID.value;
    }
    return null;
  } catch (err) {
    console.warn('Failed to query Wikidata for Netflix ID', err);
    return null;
  }
}

export async function getPersonDetails(id: string): Promise<any> {
  try {
    const details = await fetchFromTmdb(`/person/${id}`);
    const credits = await fetchFromTmdb(`/person/${id}/combined_credits`);
    
    const knownFor = (credits.cast || [])
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 8)
      .map((c: any) => mapTmdbMovie(c, c.media_type === 'tv'));

    return {
      id: String(details.id),
      name: details.name,
      biography: details.biography || 'Biography not available.',
      birthday: details.birthday || 'N/A',
      placeOfBirth: details.place_of_birth || 'N/A',
      profileUrl: details.profile_path ? `https://image.tmdb.org/t/p/h632${details.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      knownFor,
      knownForDepartment: details.known_for_department || 'Acting',
    };
  } catch (err) {
    // Local fallback for cast/person details
    return {
      id,
      name: 'Cinematic Talent',
      biography: 'A highly recognized and versatile film industry professional with numerous critically acclaimed performances.',
      birthday: '1985-06-15',
      placeOfBirth: 'Los Angeles, California, USA',
      profileUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=80',
      knownFor: MOCK_MOVIES.slice(0, 3),
      knownForDepartment: 'Acting',
    };
  }
}

export async function getRecommendations(id: string, isTvShow: boolean = false): Promise<Movie[]> {
  try {
    const endpoint = isTvShow ? `/tv/${id}/recommendations` : `/movie/${id}/recommendations`;
    const data = await fetchFromTmdb(endpoint);
    return data.results.slice(0, 8).map((m: any) => mapTmdbMovie(m, isTvShow));
  } catch (err) {
    return MOCK_MOVIES.filter(m => m.id !== id).slice(0, 4);
  }
}
