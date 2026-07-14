import { Movie, TVShow, Review, User, Announcement } from '../types';

export const MOCK_GENRES = [
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Thriller',
  'Animation',
  'Mystery',
  'Romance',
  'Fantasy',
  'Horror'
];

export const MOCK_STREAMING_PLATFORMS = [
  'Netflix',
  'Prime Video',
  'Disney+',
  'Apple TV+',
  'Max',
  'Hulu',
  'Paramount+'
];

export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    email: 'ssanganiromil@gmail.com',
    username: 'romils',
    displayName: 'Romil Sangani',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    bio: 'Rovix Creator. Obsessed with high-fidelity sound design, Christopher Nolan, and beautifully composed tracking shots.',
    favoriteGenres: ['Sci-Fi', 'Thriller', 'Drama'],
    joinedDate: '2026-01-01',
    followersCount: 1420,
    followingCount: 382,
    isAdmin: true
  },
  {
    id: 'user_2',
    email: 'cinephile99@gmail.com',
    username: 'moviebuff',
    displayName: 'Clara Oswald',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    bio: 'Self-proclaimed movie critic. Watching 365 films a year. Always ready to argue why Paddington 2 is a masterpiece.',
    favoriteGenres: ['Comedy', 'Animation', 'Drama'],
    joinedDate: '2026-02-15',
    followersCount: 521,
    followingCount: 231,
    isAdmin: false
  },
  {
    id: 'user_3',
    email: 'nolanfan@gmail.com',
    username: 'interstellar_nerd',
    displayName: 'Cooper Nolan',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    bio: 'No, you don\'t understand, the docking scene in Interstellar is a cinematic milestone. Memento is my favorite puzzle.',
    favoriteGenres: ['Sci-Fi', 'Mystery', 'Thriller'],
    joinedDate: '2026-03-10',
    followersCount: 89,
    followingCount: 194,
    isAdmin: false
  },
  {
    id: 'user_4',
    email: 'indie_guru@rovix.com',
    username: 'indie_guru',
    displayName: 'Anya Taylor',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    bio: 'A24 enthusiast. I prefer movies with zero dialog and maximum existential dread. Based in Brooklyn.',
    favoriteGenres: ['Horror', 'Drama', 'Mystery'],
    joinedDate: '2026-04-01',
    followersCount: 312,
    followingCount: 421,
    isAdmin: false
  }
];

export const MOCK_MOVIES: Movie[] = [
  {
    id: 'm_1',
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', // Dune aesthetic desert/stars
    genres: ['Action', 'Sci-Fi', 'Drama'],
    runtime: 166,
    releaseDate: '2024-03-01',
    language: 'English',
    country: 'United States',
    status: 'Released',
    budget: 190000000,
    revenue: 712000000,
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Timothée Chalamet', character: 'Paul Atreides', profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
      { name: 'Zendaya', character: 'Chani', profileUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80' },
      { name: 'Rebecca Ferguson', character: 'Lady Jessica', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
      { name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Legendary Pictures', 'Warner Bros. Pictures'],
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    gallery: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470115636472-7d2a15865095?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Max', 'Hulu'],
    rating: 4.6,
    communityRating: 4.8,
    totalRatingsCount: 1542
  },
  {
    id: 'm_2',
    title: 'Oppenheimer',
    tagline: 'The world forever changes.',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, showing his scientific brilliance, his leadership of the Manhattan Project, and the dramatic political fallout of his actions in the post-war era.',
    backdropUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop&q=80', // Golden fire explosion sky
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=80', // Vintage technical film
    genres: ['Drama', 'Thriller'],
    runtime: 180,
    releaseDate: '2023-07-21',
    language: 'English',
    country: 'United States',
    status: 'Released',
    budget: 100000000,
    revenue: 957000000,
    director: 'Christopher Nolan',
    cast: [
      { name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profileUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
      { name: 'Emily Blunt', character: 'Kitty Oppenheimer', profileUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=80' },
      { name: 'Robert Downey Jr.', character: 'Lewis Strauss', profileUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80' },
      { name: 'Florence Pugh', character: 'Jean Tatlock', profileUrl: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Syncopy', 'Atlas Entertainment', 'Universal Pictures'],
    trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
    gallery: [
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Prime Video', 'Apple TV+'],
    rating: 4.7,
    communityRating: 4.7,
    totalRatingsCount: 1982
  },
  {
    id: 'm_3',
    title: 'Spider-Man: Across the Spider-Verse',
    tagline: 'It\'s how you wear the mask.',
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society, a team of Spider-People charged with protecting the Multiverse’s very existence. But when the heroes clash on how to handle a new threat, Miles finds himself pitted against the other Spiders.',
    backdropUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80', // Vibrant cyberpunk neon glow
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&auto=format&fit=crop&q=80', // Spider costume
    genres: ['Animation', 'Action', 'Sci-Fi'],
    runtime: 140,
    releaseDate: '2023-06-02',
    language: 'English',
    country: 'United States',
    status: 'Released',
    budget: 150000000,
    revenue: 690500000,
    director: 'Joaquim Dos Santos',
    cast: [
      { name: 'Shameik Moore', character: 'Miles Morales / Spider-Man', profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
      { name: 'Hailee Steinfeld', character: 'Gwen Stacy / Spider-Gwen', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
      { name: 'Oscar Isaac', character: 'Miguel O\'Hara / Spider-Man 2099', profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Columbia Pictures', 'Sony Pictures Animation', 'Marvel Entertainment'],
    trailerUrl: 'https://www.youtube.com/embed/shW9i6k8cB0',
    gallery: [
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Netflix'],
    rating: 4.8,
    communityRating: 4.9,
    totalRatingsCount: 2210
  },
  {
    id: 'm_4',
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', // Space galaxies wormhole
    posterUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=500&auto=format&fit=crop&q=80', // Stars sky astronomy
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    runtime: 169,
    releaseDate: '2014-11-07',
    language: 'English',
    country: 'United States',
    status: 'Released',
    budget: 165000000,
    revenue: 731000000,
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', character: 'Cooper', profileUrl: 'https://images.unsplash.com/photo-1504257400765-1888925ddd29?w=100&auto=format&fit=crop&q=80' },
      { name: 'Anne Hathaway', character: 'Brand', profileUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
      { name: 'Jessica Chastain', character: 'Murph', profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Paramount Pictures', 'Warner Bros. Pictures', 'Legendary Pictures', 'Syncopy'],
    trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    gallery: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Paramount+', 'Prime Video'],
    rating: 4.9,
    communityRating: 4.9,
    totalRatingsCount: 3840
  },
  {
    id: 'm_5',
    title: 'Everything Everywhere All at Once',
    tagline: 'The universe is so much bigger than you realize.',
    overview: 'An aging Chinese immigrant is swept up in an insane adventure, in which she alone can save the world by exploring other universes connecting with the lives she could have led.',
    backdropUrl: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=1200&auto=format&fit=crop&q=80', // Kaleidoscopic trippy lights
    posterUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=500&auto=format&fit=crop&q=80', // Fun colorful collage look
    genres: ['Action', 'Comedy', 'Sci-Fi', 'Drama'],
    runtime: 139,
    releaseDate: '2022-03-24',
    language: 'English',
    country: 'United States',
    status: 'Released',
    budget: 25000000,
    revenue: 143000000,
    director: 'Daniel Kwan, Daniel Scheinert',
    cast: [
      { name: 'Michelle Yeoh', character: 'Evelyn Wang', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
      { name: 'Ke Huy Quan', character: 'Waymond Wang', profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
      { name: 'Jamie Lee Curtis', character: 'Deirdre Beaubeirdre', profileUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['A24', 'IAC Films'],
    trailerUrl: 'https://www.youtube.com/embed/wxN1T1uxQ2g',
    gallery: [
      'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Netflix', 'Max'],
    rating: 4.5,
    communityRating: 4.6,
    totalRatingsCount: 1723
  },
  {
    id: 'up_1',
    title: 'Avatar: Fire and Ash',
    tagline: 'A new flame burns in Pandora.',
    overview: 'In the third chapter of the sci-fi adventure, Jake Sully and Neytiri encounter a dangerous, aggressive volcanic tribe of Na\'vi known as the Ash People, who challenge their perceptions of harmony and conflict on Pandora.',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    runtime: 185,
    releaseDate: '2025-12-19',
    language: 'English',
    country: 'United States',
    status: 'Upcoming',
    budget: 250000000,
    revenue: 0,
    director: 'James Cameron',
    cast: [
      { name: 'Sam Worthington', character: 'Jake Sully', profileUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
      { name: 'Zoe Saldana', character: 'Neytiri', profileUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' }
    ],
    productionCompanies: ['20th Century Studios', 'Lightstorm Entertainment'],
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
    gallery: [],
    streamingPlatforms: ['Disney+'],
    rating: 0,
    communityRating: 4.8,
    totalRatingsCount: 0
  },
  {
    id: 'up_2',
    title: 'Superman (2025)',
    tagline: 'A symbol of hope.',
    overview: 'The film explores Superman\'s journey to reconcile his Kryptonian heritage with his human upbringing as Clark Kent of Smallville, Kansas. He is the embodiment of truth, justice and a better tomorrow, guided by human kindness in a world that sees kindness as old-fashioned.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    runtime: 145,
    releaseDate: '2025-07-11',
    language: 'English',
    country: 'United States',
    status: 'Upcoming',
    budget: 150000000,
    revenue: 0,
    director: 'James Gunn',
    cast: [
      { name: 'David Corenswet', character: 'Clark Kent / Superman', profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
      { name: 'Rachel Brosnahan', character: 'Lois Lane', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }
    ],
    productionCompanies: ['DC Studios', 'Warner Bros. Pictures'],
    trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
    gallery: [],
    streamingPlatforms: ['Max'],
    rating: 0,
    communityRating: 4.9,
    totalRatingsCount: 0
  }
];

export const MOCK_TV_SHOWS: TVShow[] = [
  {
    id: 'tv_1',
    title: 'Succession',
    tagline: 'Who will succeed?',
    overview: 'Follow the lives of the Roy family as they contemplate their future once their aging father begins to step back from the media and entertainment empire they control.',
    backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80', // Sleek glass skyscraper empire
    posterUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&auto=format&fit=crop&q=80', // Boardroom suit theme
    genres: ['Drama'],
    runtime: 60,
    releaseDate: '2018-06-03',
    language: 'English',
    country: 'United States',
    status: 'Ended',
    budget: 90000000,
    revenue: 0,
    director: 'Jesse Armstrong',
    cast: [
      { name: 'Brian Cox', character: 'Logan Roy', profileUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
      { name: 'Jeremy Strong', character: 'Kendall Roy', profileUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80' },
      { name: 'Sarah Snook', character: 'Shiv Roy', profileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
      { name: 'Kieran Culkin', character: 'Roman Roy', profileUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['HBO Entertainment', 'Project Zeus'],
    trailerUrl: 'https://www.youtube.com/embed/OzY2qKS0P18',
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Max'],
    rating: 4.8,
    communityRating: 4.8,
    totalRatingsCount: 941,
    isTvShow: true,
    seasons: 4,
    episodes: 39
  },
  {
    id: 'tv_2',
    title: 'The Last of Us',
    tagline: 'When you are lost in the darkness, look for the light.',
    overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey, as they both must traverse the U.S. and depend on each other for survival.',
    backdropUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80', // Overgrown forest wilderness
    posterUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&auto=format&fit=crop&q=80', // Post apocalyptic dark mossy feel
    genres: ['Drama', 'Action', 'Thriller'],
    runtime: 50,
    releaseDate: '2023-01-15',
    language: 'English',
    country: 'United States',
    status: 'Returning Series',
    budget: 120000000,
    revenue: 0,
    director: 'Craig Mazin, Neil Druckmann',
    cast: [
      { name: 'Pedro Pascal', character: 'Joel Miller', profileUrl: 'https://images.unsplash.com/photo-1504257400765-1888925ddd29?w=100&auto=format&fit=crop&q=80' },
      { name: 'Bella Ramsey', character: 'Ellie Williams', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Sony Pictures Television', 'PlayStation Productions', 'Naughty Dog'],
    trailerUrl: 'https://www.youtube.com/embed/uLtkt8BonwM',
    gallery: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Max', 'Disney+'],
    rating: 4.7,
    communityRating: 4.7,
    totalRatingsCount: 1421,
    isTvShow: true,
    seasons: 1,
    episodes: 9
  },
  {
    id: 'tv_3',
    title: 'Severance',
    tagline: 'Please enjoy each department equally.',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
    backdropUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80', // Brutalist clean office lights
    posterUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80', // Tech clean geometry vibe
    genres: ['Sci-Fi', 'Thriller', 'Mystery'],
    runtime: 45,
    releaseDate: '2022-02-18',
    language: 'English',
    country: 'United States',
    status: 'Returning Series',
    budget: 50000000,
    revenue: 0,
    director: 'Ben Stiller, Aoife McArdle',
    cast: [
      { name: 'Adam Scott', character: 'Mark Scout', profileUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80' },
      { name: 'Patricia Arquette', character: 'Harmony Cobel', profileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
      { name: 'John Turturro', character: 'Irving Bailiwick', profileUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' }
    ],
    productionCompanies: ['Red Hour Productions', 'Endeavor Content'],
    trailerUrl: 'https://www.youtube.com/embed/xKTgpdp7_x0',
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80'
    ],
    streamingPlatforms: ['Apple TV+'],
    rating: 4.8,
    communityRating: 4.8,
    totalRatingsCount: 812,
    isTvShow: true,
    seasons: 1,
    episodes: 9
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r_1',
    movieId: 'm_1',
    movieTitle: 'Dune: Part Two',
    moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    isTvShow: false,
    userId: 'user_2',
    username: 'moviebuff',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'An absolute masterpiece of audio-visual scale',
    body: 'Denis Villeneuve has done the impossible. He has taken the most difficult parts of Frank Herbert\'s masterpiece and simplified it without losing an ounce of its epic substance. The sound design is incredibly bone-rattling. Hans Zimmer\'s score hits like a freight train, and Greig Fraser\'s desert lighting makes every frame look like an expensive Renaissance painting. Timothée has fully transitioned into the Lisan al-Gaib. Austin Butler is phenomenal as Feyd. Do not miss this in IMAX.',
    rating: 5.0,
    isSpoiler: false,
    likes: 124,
    likedBy: ['user_3', 'user_4'],
    replies: [
      {
        id: 'rep_1',
        userId: 'user_3',
        username: 'interstellar_nerd',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        body: 'Absolutely. The thumper sound in the sand was literally vibrating my chest in the theater! Best sci-fi of the decade so far.',
        createdAt: '2024-03-02'
      }
    ],
    isReported: false,
    createdAt: '2024-03-01'
  },
  {
    id: 'r_2',
    movieId: 'm_2',
    movieTitle: 'Oppenheimer',
    moviePoster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=80',
    isTvShow: false,
    userId: 'user_3',
    username: 'interstellar_nerd',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'The Trinity Test scene gave me literal chills!',
    body: 'Nolan is at the peak of his craftsmanship. By avoiding CGI for the Trinity nuclear explosion, he gave the atomic fire an unpredictable, terrifying weight. Cillian Murphy acts with his eyes, conveying deep scientific brilliance mixed with an agonizing weight of doom. Ludwig Göransson\'s score is a character of its own. Truly historical storytelling.',
    rating: 4.5,
    isSpoiler: false,
    likes: 98,
    likedBy: ['user_2'],
    replies: [],
    isReported: false,
    createdAt: '2023-07-22'
  },
  {
    id: 'r_3',
    movieId: 'tv_3',
    movieTitle: 'Severance',
    moviePoster: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    isTvShow: true,
    userId: 'user_4',
    username: 'indie_guru',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    title: 'A masterclass in modern mystery and office satire',
    body: 'The premise is brilliant, but the execution is breathtaking. The clinical, brutalist aesthetic of Lumon Industries creates a stifling sense of dread. The acting is flawless, especially Adam Scott toggling between "Innie" and "Outie" Mark with subtle micro-expressions. That season finale is the most intense hour of television I have seen in years.',
    rating: 5.0,
    isSpoiler: true,
    likes: 42,
    likedBy: ['user_2', 'user_1'],
    replies: [],
    isReported: false,
    createdAt: '2022-03-15'
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Rovix 2.0 Launched!',
    content: 'Welcome to the premier movie & TV tracking experience. Set up your watchlist, connect with other film lovers, write dynamic reviews, and sync your favorite shows.',
    createdAt: '2026-07-10',
    badge: 'NEW'
  },
  {
    id: 'ann_2',
    title: 'TMDb Search Integration Live',
    content: 'You can now configure your personal TMDb API key in Settings to enjoy instant live search, cast data, and real-time streaming availability from the largest film database.',
    createdAt: '2026-07-12',
    badge: 'UPDATE'
  }
];
