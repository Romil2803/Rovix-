import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  arrayUnion, 
  arrayRemove,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  User, 
  Movie, 
  TVShow, 
  Review, 
  Rating, 
  WatchlistItem, 
  Follow, 
  Report, 
  Notification, 
  Announcement, 
  WatchlistStatus,
  CommunityPost,
  CommunityComment,
  CustomWatchlist
} from '../types';
import { MOCK_MOVIES, MOCK_TV_SHOWS, MOCK_REVIEWS, MOCK_USERS, MOCK_ANNOUNCEMENTS } from '../data/mockData';

// ----------------------------------------------------
// Memory cache synchronized with Firestore + Local Fallback
// ----------------------------------------------------
let usersCache: User[] = [];
let reviewsCache: Review[] = [];
let ratingsCache: Rating[] = [];
let watchlistCache: WatchlistItem[] = [];
let customWatchlistsCache: CustomWatchlist[] = [];
let followsCache: Follow[] = [];
let reportsCache: Report[] = [];
let notificationsCache: Notification[] = [];
let announcementsCache: Announcement[] = [];
let localMoviesCache: Movie[] = [...MOCK_MOVIES, ...MOCK_TV_SHOWS];
let communityPostsCache: CommunityPost[] = [];
let collectionsCache: any[] = []; // Type any to avoid strict Collection import issues, or can cast to any inside functions
let fanzoneThreadsCache: any[] = [];
let fanzoneTheoriesCache: any[] = [];
let fanzonePollsCache: any[] = [];
let fanzoneQuotesCache: any[] = [];

let currentRovixUser: User | null = null;
const changeListeners = new Set<() => void>();

// Subscribe to local cache changes to re-render UI in real-time
export function subscribeToDatabaseChanges(callback: () => void) {
  changeListeners.add(callback);
  return () => {
    changeListeners.delete(callback);
  };
}

function notifyListeners() {
  changeListeners.forEach(cb => cb());
}

// ----------------------------------------------------
// Real-time Firestore Sync Subscriptions
// ----------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error caught: ', JSON.stringify(errInfo));
  // In the real preview environment, we log/warn it to let standard fallback operation continue smoothly.
  // We can also throw the formatted error so any automated checks or tests can trace it.
  throw new Error(JSON.stringify(errInfo));
}

let notificationsUnsubscribe: (() => void) | null = null;
let reportsUnsubscribe: (() => void) | null = null;

export function initRealtimeSync() {
  // Listen to users
  onSnapshot(collection(db, 'users'), (snapshot) => {
    const list: User[] = [];
    snapshot.forEach(d => list.push(d.data() as User));
    if (list.length > 0) {
      usersCache = list;
    }
    // Update current user if already logged in
    const authUser = auth.currentUser;
    if (authUser) {
      const match = usersCache.find(u => u.id === authUser.uid);
      if (match) currentRovixUser = match;
    }
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'users');
  });

  // Listen to reviews
  onSnapshot(collection(db, 'reviews'), (snapshot) => {
    const list: Review[] = [];
    snapshot.forEach(d => list.push(d.data() as Review));
    reviewsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'reviews');
  });

  // Listen to ratings
  onSnapshot(collection(db, 'ratings'), (snapshot) => {
    const list: Rating[] = [];
    snapshot.forEach(d => list.push(d.data() as Rating));
    ratingsCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'ratings');
  });

  // Listen to watchlist
  onSnapshot(collection(db, 'watchlist'), (snapshot) => {
    const list: WatchlistItem[] = [];
    snapshot.forEach(d => list.push(d.data() as WatchlistItem));
    watchlistCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'watchlist');
  });

  // Listen to custom watchlists
  onSnapshot(collection(db, 'custom_watchlists'), (snapshot) => {
    const list: CustomWatchlist[] = [];
    snapshot.forEach(d => list.push(d.data() as CustomWatchlist));
    customWatchlistsCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'custom_watchlists');
  });

  // Listen to follows
  onSnapshot(collection(db, 'follows'), (snapshot) => {
    const list: Follow[] = [];
    snapshot.forEach(d => list.push(d.data() as Follow));
    followsCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'follows');
  });

  // Listen to announcements
  onSnapshot(collection(db, 'announcements'), (snapshot) => {
    const list: Announcement[] = [];
    snapshot.forEach(d => list.push(d.data() as Announcement));
    if (list.length > 0) {
      announcementsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'announcements');
  });

  // Listen to community posts
  onSnapshot(collection(db, 'community_posts'), (snapshot) => {
    const list: CommunityPost[] = [];
    snapshot.forEach(d => list.push(d.data() as CommunityPost));
    communityPostsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'community_posts');
  });

  // Listen to curated collections
  onSnapshot(collection(db, 'collections'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach(d => list.push(d.data()));
    collectionsCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'collections');
  });

  // Listen to fanzone threads
  onSnapshot(collection(db, 'fanzone_threads'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach(d => list.push(d.data()));
    fanzoneThreadsCache = list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'fanzone_threads');
  });

  // Listen to fanzone theories
  onSnapshot(collection(db, 'fanzone_theories'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach(d => list.push(d.data()));
    fanzoneTheoriesCache = list.sort((a, b) => b.likes - a.likes);
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'fanzone_theories');
  });

  // Listen to fanzone polls
  onSnapshot(collection(db, 'fanzone_polls'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach(d => list.push(d.data()));
    fanzonePollsCache = list;
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'fanzone_polls');
  });

  // Listen to fanzone quotes
  onSnapshot(collection(db, 'fanzone_quotes'), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach(d => list.push(d.data()));
    fanzoneQuotesCache = list.sort((a, b) => b.votes - a.votes);
    notifyListeners();
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'fanzone_quotes');
  });

  // Dynamically manage auth-required subscriptions
  onAuthStateChanged(auth, async (firebaseUser) => {
    // Unsubscribe from previous listeners
    if (notificationsUnsubscribe) {
      notificationsUnsubscribe();
      notificationsUnsubscribe = null;
    }
    if (reportsUnsubscribe) {
      reportsUnsubscribe();
      reportsUnsubscribe = null;
    }

    if (firebaseUser) {
      // Subscribe to user-specific notifications to align with Firestore rules
      const q = query(collection(db, 'notifications'), where('userId', '==', firebaseUser.uid));
      notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach(d => list.push(d.data() as Notification));
        notificationsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        notifyListeners();
      }, (error) => {
        console.warn('Notifications real-time sync disabled or restricted:', error.message);
      });

      // Subscribe to reports (accessible when authenticated)
      reportsUnsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const list: Report[] = [];
        snapshot.forEach(d => list.push(d.data() as Report));
        reportsCache = list;
        notifyListeners();
      }, (error) => {
        console.warn('Reports real-time sync restricted:', error.message);
      });

      // Seed mock data if database is empty now that we are authenticated
      seedInitialFirestoreData();
    } else {
      notificationsCache = [];
      reportsCache = [];
      notifyListeners();
    }
  });
}

// Automatically seed mock data to Firestore once if collection is empty
export async function seedInitialFirestoreData() {
  // Empty to prevent any mock or fake dummy data from being seeded to the database.
  console.log('Skipping mock data seeding to ensure a 100% clean and real database.');
}

// ----------------------------------------------------
// Legacy compat interface
// ----------------------------------------------------
export function initDatabase() {
  initRealtimeSync();
}

export function getTMDBKey(): string {
  return localStorage.getItem('local_tmdb_key') || '';
}

export function setTMDBKey(key: string): void {
  localStorage.setItem('local_tmdb_key', key);
}

// ----------------------------------------------------
// User / Auth Operations
// ----------------------------------------------------
export function getCurrentUser(): User | null {
  return currentRovixUser;
}

export function setCurrentUser(user: User | null): void {
  currentRovixUser = user;
  notifyListeners();
}

export function getUsersList(): User[] {
  return usersCache;
}

export async function syncOrCreateUserProfile(firebaseUser: any, customUsername?: string, customDisplayName?: string): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const profile = userSnap.data() as User;
    currentRovixUser = profile;
    notifyListeners();
    return profile;
  } else {
    // Generate standard profile
    const email = firebaseUser.email || '';
    const username = customUsername || email.split('@')[0] || 'user_' + Math.floor(Math.random() * 10000);
    const displayName = customDisplayName || firebaseUser.displayName || username;

    const newProfile: User = {
      id: firebaseUser.uid,
      email,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      displayName,
      avatarUrl: firebaseUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
      bio: 'Movie & TV tracker enthusiast.',
      favoriteGenres: [],
      joinedDate: new Date().toISOString().split('T')[0],
      followersCount: 0,
      followingCount: 0,
      isAdmin: email.toLowerCase() === 'ssanganiromil@gmail.com' || username.toLowerCase() === 'admin'
    };

    await setDoc(userRef, newProfile);
    currentRovixUser = newProfile;
    notifyListeners();

    // Trigger welcome system notification
    await addNotification(
      newProfile.id,
      'news',
      'System',
      newProfile.avatarUrl,
      'Welcome to Rovix! Search and track your favorite cinematic releases.',
      undefined
    );

    return newProfile;
  }
}

export async function registerUser(email: string, username: string, displayName: string) {
  // Backwards compatibility layer
  return { success: false, error: 'Please use authentic Sign Up forms in AuthScreen.' };
}

export async function loginUser(emailOrUser: string) {
  // Backwards compatibility layer
  return { success: false, error: 'Please use auth fields in AuthScreen.' };
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, updates, { merge: true });
  
  // Update cache immediately
  const index = usersCache.findIndex(u => u.id === userId);
  if (index !== -1) {
    usersCache[index] = { ...usersCache[index], ...updates };
    if (currentRovixUser && currentRovixUser.id === userId) {
      currentRovixUser = usersCache[index];
    }
  }
  notifyListeners();
  return currentRovixUser!;
}

export async function deleteAccount(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    if (currentRovixUser?.id === userId) {
      currentRovixUser = null;
    }
    notifyListeners();
  } catch (err) {
    console.error('Delete account error:', err);
  }
}

// ----------------------------------------------------
// Follow Network Systems
// ----------------------------------------------------
export function getFollowers(userId: string): User[] {
  const followerIds = followsCache.filter(f => f.followingId === userId).map(f => f.followerId);
  return usersCache.filter(u => followerIds.includes(u.id));
}

export function getFollowing(userId: string): User[] {
  const followingIds = followsCache.filter(f => f.followerId === userId).map(f => f.followingId);
  return usersCache.filter(u => followingIds.includes(u.id));
}

export function isFollowing(followerId: string, followingId: string): boolean {
  return followsCache.some(f => f.followerId === followerId && f.followingId === followingId);
}

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;

  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'follows', followId);
  const exists = followsCache.some(f => f.followerId === followerId && f.followingId === followingId);

  if (exists) {
    await deleteDoc(followRef);
    // update counts
    await setDoc(doc(db, 'users', followerId), { followingCount: increment(-1) }, { merge: true });
    await setDoc(doc(db, 'users', followingId), { followersCount: increment(-1) }, { merge: true });
    return false;
  } else {
    const newFollow: Follow = { followerId, followingId };
    await setDoc(followRef, newFollow);
    
    // update counts
    await setDoc(doc(db, 'users', followerId), { followingCount: increment(1) }, { merge: true });
    await setDoc(doc(db, 'users', followingId), { followersCount: increment(1) }, { merge: true });

    // Trigger Notification
    const follower = currentRovixUser;
    if (follower) {
      await addNotification(
        followingId,
        'follow',
        follower.displayName,
        follower.avatarUrl,
        `${follower.displayName} started following you.`,
        followerId
      );
    }
    return true;
  }
}

export function getFollowsList(): Follow[] {
  return followsCache;
}

// ----------------------------------------------------
// Movie / TV Database Retrieval
// ----------------------------------------------------
export function getMovies(): Movie[] {
  return localMoviesCache;
}

export function getMovieById(id: string): Movie | undefined {
  return localMoviesCache.find(m => m.id === id);
}

export function adminAddMovie(media: Movie): void {
  // Push local list
  localMoviesCache.push(media);
  notifyListeners();
}

export function adminDeleteMovie(id: string): void {
  localMoviesCache = localMoviesCache.filter(m => m.id !== id);
  notifyListeners();
}

// ----------------------------------------------------
// Rating Systems (0.5 to 5 stars)
// ----------------------------------------------------
export function getRatings(movieId: string): Rating[] {
  return ratingsCache.filter(r => r.movieId === movieId);
}

export function getUserRating(userId: string, movieId: string): number {
  const found = ratingsCache.find(r => r.userId === userId && r.movieId === movieId);
  return found ? found.rating : 0;
}

export async function saveRating(userId: string, movieId: string, score: number): Promise<void> {
  const ratingId = `${userId}_${movieId}`;
  const ratingRef = doc(db, 'ratings', ratingId);

  if (score === 0) {
    await deleteDoc(ratingRef);
  } else {
    const newRating: Rating = {
      id: ratingId,
      userId,
      movieId,
      rating: score,
      createdAt: new Date().toISOString()
    };
    await setDoc(ratingRef, newRating);
  }
}

// ----------------------------------------------------
// Review Operations
// ----------------------------------------------------
export function getReviews(movieId?: string): Review[] {
  if (movieId) {
    return reviewsCache.filter(r => r.movieId === movieId);
  }
  return reviewsCache;
}

export async function addReview(
  userId: string,
  movieId: string,
  title: string,
  body: string,
  rating: number,
  isSpoiler: boolean,
  movieTitle: string,
  moviePoster: string,
  isTvShow: boolean
): Promise<Review> {
  const user = usersCache.find(u => u.id === userId) || currentRovixUser;
  if (!user) throw new Error('User profile not initialized');

  const reviewId = 'rev_' + Date.now();
  const newReview: Review = {
    id: reviewId,
    movieId,
    movieTitle,
    moviePoster,
    isTvShow,
    userId,
    username: user.username,
    userAvatar: user.avatarUrl,
    title,
    body,
    rating,
    isSpoiler,
    likes: 0,
    likedBy: [],
    replies: [],
    isReported: false,
    createdAt: new Date().toISOString().split('T')[0]
  };

  await setDoc(doc(db, 'reviews', reviewId), newReview);

  // Automatically save rating as well
  if (rating > 0) {
    await saveRating(userId, movieId, rating);
  }

  return newReview;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', reviewId));
}

export async function toggleLikeReview(reviewId: string, userId: string): Promise<{ likes: number; liked: boolean }> {
  const ref = doc(db, 'reviews', reviewId);
  const rev = reviewsCache.find(r => r.id === reviewId);
  if (!rev) throw new Error('Review not found');

  const liked = rev.likedBy.includes(userId);
  const updatedLikedBy = liked 
    ? rev.likedBy.filter(uid => uid !== userId)
    : [...rev.likedBy, userId];

  const updatedLikes = Math.max(0, liked ? rev.likes - 1 : rev.likes + 1);

  await updateDoc(ref, {
    likedBy: updatedLikedBy,
    likes: updatedLikes
  });

  // Trigger Like Notification
  if (!liked && rev.userId !== userId) {
    const liker = usersCache.find(u => u.id === userId) || currentRovixUser;
    if (liker) {
      await addNotification(
        rev.userId,
        'like',
        liker.displayName,
        liker.avatarUrl,
        `${liker.displayName} liked your review for ${rev.movieTitle}.`,
        rev.movieId
      );
    }
  }

  return { likes: updatedLikes, liked: !liked };
}

export async function addReply(reviewId: string, userId: string, body: string): Promise<void> {
  const ref = doc(db, 'reviews', reviewId);
  const rev = reviewsCache.find(r => r.id === reviewId);
  const user = usersCache.find(u => u.id === userId) || currentRovixUser;

  if (!rev || !user) throw new Error('Review or user not found');

  const reply = {
    id: 'rep_' + Date.now(),
    userId,
    username: user.username,
    userAvatar: user.avatarUrl,
    body,
    createdAt: new Date().toISOString().split('T')[0]
  };

  await updateDoc(ref, {
    replies: arrayUnion(reply)
  });

  // Trigger Notification for reply
  if (rev.userId !== userId) {
    await addNotification(
      rev.userId,
      'reply',
      user.displayName,
      user.avatarUrl,
      `${user.displayName} replied to your review on ${rev.movieTitle}.`,
      rev.movieId
    );
  }
}

// ----------------------------------------------------
// Watchlist Systems
// ----------------------------------------------------
export function getWatchlist(userId: string): WatchlistItem[] {
  return watchlistCache.filter(w => w.userId === userId);
}

export async function toggleWatchlist(
  userId: string, 
  movieId: string, 
  movieTitle: string = 'Untitled Media', 
  moviePoster: string = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80', 
  isTvShow: boolean = false,
  status: WatchlistStatus = 'Plan to Watch'
): Promise<void> {
  const itemId = `${userId}_${movieId}`;
  const ref = doc(db, 'watchlist', itemId);
  const exists = watchlistCache.some(w => w.userId === userId && w.movieId === movieId);

  if (exists) {
    await deleteDoc(ref);
  } else {
    const newItem: WatchlistItem = {
      id: itemId,
      userId,
      movieId,
      movieTitle,
      moviePoster,
      isTvShow,
      status,
      addedAt: new Date().toISOString()
    };
    await setDoc(ref, newItem);
  }
}

export async function updateWatchlistStatus(
  userId: string, 
  movieId: string, 
  movieTitle: string = 'Untitled Media', 
  moviePoster: string = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80', 
  isTvShow: boolean = false,
  status: WatchlistStatus = 'Plan to Watch'
): Promise<void> {
  const itemId = `${userId}_${movieId}`;
  const ref = doc(db, 'watchlist', itemId);
  const exists = watchlistCache.some(w => w.userId === userId && w.movieId === movieId);

  if (exists) {
    await updateDoc(ref, { status });
  } else {
    await toggleWatchlist(userId, movieId, movieTitle, moviePoster, isTvShow, status);
  }
}

// ----------------------------------------------------
// Custom Watchlists (Public & Private)
// ----------------------------------------------------
export function getCustomWatchlists(userId?: string): CustomWatchlist[] {
  if (userId) {
    return customWatchlistsCache.filter(cw => cw.userId === userId);
  }
  return customWatchlistsCache;
}

export async function createCustomWatchlist(
  userId: string,
  name: string,
  description: string,
  isPrivate: boolean
): Promise<CustomWatchlist> {
  const watchlistId = 'cwl_' + Date.now();
  const newWatchlist: CustomWatchlist = {
    id: watchlistId,
    userId,
    name,
    description,
    isPrivate,
    movieIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'custom_watchlists', watchlistId), newWatchlist);
  await awardXP(userId, 25, 'creating a custom watchlist');
  return newWatchlist;
}

export async function updateCustomWatchlist(
  watchlistId: string,
  updates: Partial<CustomWatchlist>
): Promise<void> {
  const ref = doc(db, 'custom_watchlists', watchlistId);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(ref, updatedData);
}

export async function deleteCustomWatchlist(watchlistId: string): Promise<void> {
  await deleteDoc(doc(db, 'custom_watchlists', watchlistId));
}

export async function addMovieToCustomWatchlist(watchlistId: string, movieId: string): Promise<void> {
  const wl = customWatchlistsCache.find(cw => cw.id === watchlistId);
  if (!wl) return;
  if (wl.movieIds.includes(movieId)) return;

  const updatedMovieIds = [...wl.movieIds, movieId];
  await updateDoc(doc(db, 'custom_watchlists', watchlistId), {
    movieIds: updatedMovieIds,
    updatedAt: new Date().toISOString()
  });
}

export async function removeMovieFromCustomWatchlist(watchlistId: string, movieId: string): Promise<void> {
  const wl = customWatchlistsCache.find(cw => cw.id === watchlistId);
  if (!wl) return;

  const updatedMovieIds = wl.movieIds.filter(id => id !== movieId);
  await updateDoc(doc(db, 'custom_watchlists', watchlistId), {
    movieIds: updatedMovieIds,
    updatedAt: new Date().toISOString()
  });
}

// ----------------------------------------------------
// Report Systems
// ----------------------------------------------------
export function getReports(): Report[] {
  return reportsCache;
}

export async function reportReview(reporterId: string, reviewId: string, reason: string): Promise<void> {
  const reporter = usersCache.find(u => u.id === reporterId) || currentRovixUser;
  if (!reporter) return;

  const reportId = 'rep_' + Date.now();
  const newReport: Report = {
    id: reportId,
    reporterId,
    reporterUsername: reporter.username,
    targetId: reviewId,
    targetType: 'review',
    reason,
    createdAt: new Date().toISOString(),
    resolved: false
  };

  await setDoc(doc(db, 'reports', reportId), newReport);

  // Mark review as reported
  await updateDoc(doc(db, 'reviews', reviewId), { isReported: true });
}

export async function resolveReport(reportId: string, action: 'keep' | 'delete'): Promise<void> {
  const report = reportsCache.find(r => r.id === reportId);
  if (!report) return;

  await updateDoc(doc(db, 'reports', reportId), { resolved: true });

  if (action === 'delete') {
    await deleteReview(report.targetId);
  } else {
    await updateDoc(doc(db, 'reviews', report.targetId), { isReported: false });
  }
}

// ----------------------------------------------------
// Notification Systems
// ----------------------------------------------------
export function getNotifications(userId: string): Notification[] {
  return notificationsCache.filter(n => n.userId === userId);
}

export async function addNotification(
  userId: string,
  type: 'follow' | 'like' | 'reply' | 'release' | 'news' | 'reaction' | 'community_post' | 'community_comment' | 'xp' | 'level',
  senderName: string,
  senderAvatar: string,
  content: string,
  targetId?: string
): Promise<void> {
  const notifId = 'not_' + Date.now();
  const newNotif: Notification = {
    id: notifId,
    userId,
    type,
    senderName,
    senderAvatar,
    content,
    targetId: targetId || '',
    createdAt: new Date().toISOString(),
    isRead: false
  };

  await setDoc(doc(db, 'notifications', notifId), newNotif);
}

export async function markNotificationsAsRead(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const userNotifs = notificationsCache.filter(n => n.userId === userId && !n.isRead);
  
  userNotifs.forEach(n => {
    batch.update(doc(db, 'notifications', n.id), { isRead: true });
  });

  await batch.commit();
}

// ----------------------------------------------------
// Announcement Systems
// ----------------------------------------------------
export function getAnnouncements(): Announcement[] {
  return announcementsCache;
}

export async function addAnnouncement(title: string, content: string, badge?: string): Promise<void> {
  const annId = 'ann_' + Date.now();
  const newAnn: Announcement = {
    id: annId,
    title,
    content,
    createdAt: new Date().toISOString().split('T')[0],
    badge: badge || ''
  };

  await setDoc(doc(db, 'announcements', annId), newAnn);
}

// ----------------------------------------------------
// Gamification (XP & Levels)
// ----------------------------------------------------
export async function awardXP(userId: string, amount: number, actionName: string): Promise<void> {
  const user = usersCache.find(u => u.id === userId);
  if (!user) return;
  const currentXP = user.xp || 0;
  const currentLevel = user.level || 1;
  const newXP = currentXP + amount;
  
  // Level Formula: 1 Level per 200 XP, max 50
  const calculatedLevel = Math.min(50, Math.floor(newXP / 200) + 1);
  
  const updates: Partial<User> = { xp: newXP, level: calculatedLevel };
  await updateProfile(userId, updates);

  // Trigger level up notification
  if (calculatedLevel > currentLevel) {
    await addNotification(
      userId,
      'level',
      'Rovix Level Master',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100',
      `Level Up! You reached Level ${calculatedLevel}! 🏆 Keep tracking movies to unlock premium badges.`,
      undefined
    );
  } else {
    // Ordinary XP log in notifications
    await addNotification(
      userId,
      'xp',
      'Rovix Level Master',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100',
      `You earned +${amount} XP for ${actionName}! ⭐`,
      undefined
    );
  }
}

// ----------------------------------------------------
// Review Reactions
// ----------------------------------------------------
export async function addReviewReaction(
  reviewId: string, 
  reactionType: 'helpful' | 'lovedIt' | 'greatAnalysis' | 'funny' | 'mindBlown', 
  userId: string
): Promise<void> {
  const review = reviewsCache.find(r => r.id === reviewId);
  if (!review) return;

  const reactions = review.reactions || {};
  const currentType = reactions[reactionType] || [];
  const alreadyReacted = currentType.includes(userId);

  const updatedType = alreadyReacted 
    ? currentType.filter(id => id !== userId) 
    : [...currentType, userId];

  const updatedReactions = {
    ...reactions,
    [reactionType]: updatedType
  };

  await updateDoc(doc(db, 'reviews', reviewId), { reactions: updatedReactions });

  if (!alreadyReacted && review.userId !== userId) {
    await awardXP(userId, 5, 'reacting to a review');
    await addNotification(
      review.userId,
      'reaction',
      currentRovixUser?.displayName || currentRovixUser?.username || 'Someone',
      currentRovixUser?.avatarUrl || '',
      `reacted with "${reactionType}" to your review of ${review.movieTitle}.`,
      review.movieId
    );
  }
}

// ----------------------------------------------------
// Curated Collections (Playlists)
// ----------------------------------------------------
export function getCollections(): any[] {
  return collectionsCache;
}

export async function createCollection(
  userId: string,
  username: string,
  title: string,
  desc: string,
  backdrop: string,
  movieIds: string[],
  isPrivate: boolean = false
): Promise<void> {
  const colId = 'col_' + Date.now();
  const newCol = {
    id: colId,
    title,
    desc,
    creator: username,
    creatorId: userId,
    backdrop: backdrop || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    movieIds,
    likes: 0,
    likedBy: [],
    followers: 0,
    followedBy: [],
    comments: [],
    isPrivate,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'collections', colId), newCol);
  await awardXP(userId, 40, 'creating a movie collection');
}

export async function likeCollection(colId: string, userId: string): Promise<void> {
  const col = collectionsCache.find(c => c.id === colId);
  if (!col) return;

  const alreadyLiked = col.likedBy.includes(userId);
  const likedBy = alreadyLiked ? col.likedBy.filter((id: string) => id !== userId) : [...col.likedBy, userId];
  const likes = alreadyLiked ? col.likes - 1 : col.likes + 1;

  await updateDoc(doc(db, 'collections', colId), { likes, likedBy });

  if (!alreadyLiked && col.creatorId && col.creatorId !== userId) {
    await awardXP(userId, 5, 'liking a curated collection');
    await addNotification(
      col.creatorId,
      'like',
      currentRovixUser?.displayName || currentRovixUser?.username || 'Someone',
      currentRovixUser?.avatarUrl || '',
      `liked your movie playlist "${col.title}".`,
      undefined
    );
  }
}

export async function followCollection(colId: string, userId: string): Promise<void> {
  const col = collectionsCache.find(c => c.id === colId);
  if (!col) return;

  const alreadyFollowed = col.followedBy.includes(userId);
  const followedBy = alreadyFollowed ? col.followedBy.filter((id: string) => id !== userId) : [...col.followedBy, userId];
  const followers = alreadyFollowed ? col.followers - 1 : col.followers + 1;

  await updateDoc(doc(db, 'collections', colId), { followers, followedBy });
}

export async function addCollectionComment(colId: string, author: string, body: string): Promise<void> {
  const col = collectionsCache.find(c => c.id === colId);
  if (!col) return;

  const comment = {
    id: 'cc_' + Date.now(),
    author,
    body,
    date: 'Just now',
    createdAt: new Date().toISOString()
  };

  const comments = [...(col.comments || []), comment];
  await updateDoc(doc(db, 'collections', colId), { comments });

  if (col.creatorId && currentRovixUser && col.creatorId !== currentRovixUser.id) {
    await awardXP(currentRovixUser.id, 10, 'commenting on a playlist');
    await addNotification(
      col.creatorId,
      'reply',
      currentRovixUser.displayName || currentRovixUser.username,
      currentRovixUser.avatarUrl,
      `commented on your playlist "${col.title}": "${body.substring(0, 30)}..."`
    );
  }
}

// ----------------------------------------------------
// Community Posts & Comments & Polls
// ----------------------------------------------------
export function getCommunityPosts(communityId?: string): CommunityPost[] {
  if (communityId) {
    return communityPostsCache.filter(p => p.communityId === communityId);
  }
  return communityPostsCache;
}

export async function createCommunityPost(
  communityId: string,
  authorId: string,
  authorUsername: string,
  authorAvatar: string,
  body: string,
  isSpoiler: boolean = false,
  isPoll: boolean = false,
  pollQuestion?: string,
  pollOptions?: string[]
): Promise<void> {
  const postId = 'p_' + Date.now();
  const formattedPollOptions = isPoll && pollOptions 
    ? pollOptions.map(text => ({ text, votes: 0, votedBy: [] })) 
    : [];

  const newPost: CommunityPost = {
    id: postId,
    communityId,
    authorId,
    authorUsername,
    authorAvatar,
    body,
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    comments: [],
    isSpoiler,
    isReported: false,
    isPoll,
    pollQuestion,
    pollOptions: formattedPollOptions,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'community_posts', postId), newPost);
  await awardXP(authorId, 30, 'creating a fanbase post');
}

export async function likeCommunityPost(postId: string, userId: string): Promise<void> {
  const post = communityPostsCache.find(p => p.id === postId);
  if (!post) return;

  const alreadyLiked = post.likedBy.includes(userId);
  const likedBy = alreadyLiked ? post.likedBy.filter(id => id !== userId) : [...post.likedBy, userId];
  const likes = alreadyLiked ? post.likes - 1 : post.likes + 1;

  await updateDoc(doc(db, 'community_posts', postId), { likes, likedBy });

  if (!alreadyLiked && post.authorId !== userId) {
    await awardXP(userId, 5, 'liking a community post');
    await addNotification(
      post.authorId,
      'like',
      currentRovixUser?.displayName || currentRovixUser?.username || 'Someone',
      currentRovixUser?.avatarUrl || '',
      `liked your post in ${post.communityId.replace('comm_', '').toUpperCase()}`,
      undefined
    );
  }
}

export async function voteInCommunityPoll(postId: string, optionIdx: number, userId: string): Promise<void> {
  const post = communityPostsCache.find(p => p.id === postId);
  if (!post || !post.pollOptions) return;

  const alreadyVotedIdx = post.pollOptions.findIndex(o => o.votedBy.includes(userId));
  if (alreadyVotedIdx !== -1) return; // Limit 1 vote

  const updatedOptions = post.pollOptions.map((opt, idx) => {
    if (idx !== optionIdx) return opt;
    return {
      ...opt,
      votes: opt.votes + 1,
      votedBy: [...opt.votedBy, userId]
    };
  });

  await updateDoc(doc(db, 'community_posts', postId), { pollOptions: updatedOptions });
  await awardXP(userId, 10, 'casting a fanbase poll vote');
}

export async function addCommunityComment(
  postId: string,
  authorId: string,
  authorUsername: string,
  authorAvatar: string,
  body: string,
  isSpoiler: boolean = false
): Promise<void> {
  const post = communityPostsCache.find(p => p.id === postId);
  if (!post) return;

  const comment: CommunityComment = {
    id: 'ccm_' + Date.now(),
    authorId,
    authorUsername,
    authorAvatar,
    body,
    isSpoiler,
    isReported: false,
    createdAt: new Date().toISOString()
  };

  const comments = [...(post.comments || []), comment];
  await updateDoc(doc(db, 'community_posts', postId), { 
    comments,
    commentsCount: comments.length
  });

  await awardXP(authorId, 15, 'replying on community thread');

  if (post.authorId !== authorId) {
    await addNotification(
      post.authorId,
      'community_comment',
      authorUsername,
      authorAvatar,
      `commented on your fanbase thread: "${body.substring(0, 35)}..."`,
      undefined
    );
  }
}

export async function reportCommunityContent(
  reporterId: string,
  targetId: string,
  targetType: 'post' | 'comment',
  reason: string,
  communityId?: string
): Promise<void> {
  const reporter = usersCache.find(u => u.id === reporterId) || currentRovixUser;
  if (!reporter) return;

  const reportId = 'rep_' + Date.now();
  const newReport: Report = {
    id: reportId,
    reporterId,
    reporterUsername: reporter.username,
    targetId,
    targetType,
    reason,
    createdAt: new Date().toISOString(),
    resolved: false,
    communityId
  };

  await setDoc(doc(db, 'reports', reportId), newReport);

  if (targetType === 'post') {
    await updateDoc(doc(db, 'community_posts', targetId), { isReported: true });
  }
}

export async function resolveCommunityReport(reportId: string, action: 'keep' | 'delete'): Promise<void> {
  const report = reportsCache.find(r => r.id === reportId);
  if (!report) return;

  await updateDoc(doc(db, 'reports', reportId), { resolved: true });

  if (report.targetType === 'post') {
    if (action === 'delete') {
      await deleteDoc(doc(db, 'community_posts', report.targetId));
    } else {
      await updateDoc(doc(db, 'community_posts', report.targetId), { isReported: false });
    }
  } else if (report.targetType === 'comment') {
    const parentPost = communityPostsCache.find(p => p.comments?.some(c => c.id === report.targetId));
    if (parentPost && parentPost.comments) {
      if (action === 'delete') {
        const updatedComments = parentPost.comments.filter(c => c.id !== report.targetId);
        await updateDoc(doc(db, 'community_posts', parentPost.id), { 
          comments: updatedComments,
          commentsCount: updatedComments.length
        });
      } else {
        const updatedComments = parentPost.comments.map(c => {
          if (c.id === report.targetId) return { ...c, isReported: false };
          return c;
        });
        await updateDoc(doc(db, 'community_posts', parentPost.id), { comments: updatedComments });
      }
    }
  }
}

// ----------------------------------------------------
// Fanzone Operations
// ----------------------------------------------------
export function getFanzoneThreads(movieId: string) {
  return fanzoneThreadsCache.filter(t => t.movieId === movieId);
}

export function getFanzoneTheories(movieId: string) {
  return fanzoneTheoriesCache.filter(t => t.movieId === movieId);
}

export function getFanzonePolls(movieId: string) {
  const list = fanzonePollsCache.filter(p => p.movieId === movieId);
  if (list.length === 0) {
    // Return standard fallback polls so we don't break simple layouts if empty
    return [
      {
        id: `fzp_${movieId}_1`,
        movieId,
        question: 'How did you feel about the pacing of the screenplay?',
        options: [
          { text: 'Perfect structural pacing', votes: 12 },
          { text: 'Slightly slow in second act', votes: 8 },
          { text: 'Disjointed pacing throughout', votes: 3 }
        ],
        userVotedIdxMap: {}
      }
    ];
  }
  return list;
}

export function getFanzoneQuotes(movieId: string) {
  return fanzoneQuotesCache.filter(q => q.movieId === movieId);
}

export async function addFanzoneThread(movieId: string, author: string, body: string, isSpoiler: boolean): Promise<void> {
  const id = 'fzt_' + Date.now();
  await setDoc(doc(db, 'fanzone_threads', id), {
    id,
    movieId,
    author,
    body,
    isSpoiler,
    createdAt: new Date().toISOString()
  });
}

export async function addFanzoneTheory(movieId: string, author: string, body: string, userId: string): Promise<void> {
  const id = 'fzy_' + Date.now();
  await setDoc(doc(db, 'fanzone_theories', id), {
    id,
    movieId,
    author,
    body,
    likes: 1,
    likedBy: [userId],
    createdAt: new Date().toISOString()
  });
}

export async function voteFanzoneTheory(theoryId: string, userId: string): Promise<void> {
  const theory = fanzoneTheoriesCache.find(t => t.id === theoryId);
  if (!theory) return;
  const alreadyLiked = theory.likedBy?.includes(userId) || false;
  await updateDoc(doc(db, 'fanzone_theories', theoryId), {
    likes: alreadyLiked ? theory.likes - 1 : theory.likes + 1,
    likedBy: alreadyLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
}

export async function addFanzoneQuote(movieId: string, quote: string, character: string, userId: string): Promise<void> {
  const id = 'fzq_' + Date.now();
  await setDoc(doc(db, 'fanzone_quotes', id), {
    id,
    movieId,
    quote,
    character,
    votes: 1,
    votedBy: [userId],
    createdAt: new Date().toISOString()
  });
}

export async function voteFanzoneQuote(quoteId: string, userId: string): Promise<void> {
  const q = fanzoneQuotesCache.find(item => item.id === quoteId);
  if (!q) return;
  const alreadyVoted = q.votedBy?.includes(userId) || false;
  await updateDoc(doc(db, 'fanzone_quotes', quoteId), {
    votes: alreadyVoted ? q.votes - 1 : q.votes + 1,
    votedBy: alreadyVoted ? arrayRemove(userId) : arrayUnion(userId)
  });
}

export async function voteFanzonePoll(pollId: string, optionIdx: number, userId: string): Promise<void> {
  const poll = fanzonePollsCache.find(p => p.id === pollId);
  if (!poll) return;
  const updatedOptions = poll.options.map((opt: any, idx: number) => {
    if (idx !== optionIdx) return opt;
    return {
      ...opt,
      votes: opt.votes + 1
    };
  });
  await updateDoc(doc(db, 'fanzone_polls', pollId), {
    options: updatedOptions,
    userVotedIdxMap: {
      ...(poll.userVotedIdxMap || {}),
      [userId]: optionIdx
    }
  });
}

