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
  WatchlistStatus 
} from '../types';
import { MOCK_MOVIES, MOCK_TV_SHOWS, MOCK_REVIEWS, MOCK_USERS, MOCK_ANNOUNCEMENTS } from '../data/mockData';

// ----------------------------------------------------
// Memory cache synchronized with Firestore + Local Fallback
// ----------------------------------------------------
let usersCache: User[] = [...MOCK_USERS];
let reviewsCache: Review[] = [...MOCK_REVIEWS];
let ratingsCache: Rating[] = [];
let watchlistCache: WatchlistItem[] = [];
let followsCache: Follow[] = [];
let reportsCache: Report[] = [];
let notificationsCache: Notification[] = [];
let announcementsCache: Announcement[] = [...MOCK_ANNOUNCEMENTS];
let localMoviesCache: Movie[] = [...MOCK_MOVIES, ...MOCK_TV_SHOWS];

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
  });

  // Listen to reviews
  onSnapshot(collection(db, 'reviews'), (snapshot) => {
    const list: Review[] = [];
    snapshot.forEach(d => list.push(d.data() as Review));
    reviewsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    notifyListeners();
  });

  // Listen to ratings
  onSnapshot(collection(db, 'ratings'), (snapshot) => {
    const list: Rating[] = [];
    snapshot.forEach(d => list.push(d.data() as Rating));
    ratingsCache = list;
    notifyListeners();
  });

  // Listen to watchlist
  onSnapshot(collection(db, 'watchlist'), (snapshot) => {
    const list: WatchlistItem[] = [];
    snapshot.forEach(d => list.push(d.data() as WatchlistItem));
    watchlistCache = list;
    notifyListeners();
  });

  // Listen to follows
  onSnapshot(collection(db, 'follows'), (snapshot) => {
    const list: Follow[] = [];
    snapshot.forEach(d => list.push(d.data() as Follow));
    followsCache = list;
    notifyListeners();
  });

  // Listen to announcements
  onSnapshot(collection(db, 'announcements'), (snapshot) => {
    const list: Announcement[] = [];
    snapshot.forEach(d => list.push(d.data() as Announcement));
    if (list.length > 0) {
      announcementsCache = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    notifyListeners();
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
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding initial collections to Firestore database...');
      const batch = writeBatch(db);
      
      // Seed Users
      MOCK_USERS.forEach(u => {
        batch.set(doc(db, 'users', u.id), u);
      });

      // Seed Reviews
      MOCK_REVIEWS.forEach(r => {
        batch.set(doc(db, 'reviews', r.id), r);
      });

      // Seed Announcements
      MOCK_ANNOUNCEMENTS.forEach(a => {
        batch.set(doc(db, 'announcements', a.id), a);
      });

      await batch.commit();
      console.log('Firestore Database successfully seeded!');
    }
  } catch (err) {
    console.error('Firestore seeding failed (could be rules or network):', err);
  }
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
  type: 'follow' | 'like' | 'reply' | 'release' | 'news',
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
