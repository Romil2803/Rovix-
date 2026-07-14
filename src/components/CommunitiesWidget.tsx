import React, { useState, useEffect } from 'react';
import { Users, Heart, MessageSquare, Plus, CheckCircle, Flame, Send } from 'lucide-react';

interface CommunitiesWidgetProps {
  userId: string;
  username: string;
  userAvatar: string;
}

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  body: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  timestamp: string;
}

interface Community {
  id: string;
  name: string;
  tagline: string;
  memberCount: number;
  joinedBy: string[];
  banner: string;
  posts: CommunityPost[];
}

export default function CommunitiesWidget({ userId, username, userAvatar }: CommunitiesWidgetProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');

  const COMMUNITIES_KEY = 'rovix_communities_data';

  useEffect(() => {
    const cached = localStorage.getItem(COMMUNITIES_KEY);
    if (cached) {
      setCommunities(JSON.parse(cached));
    } else {
      // Seed default vibrant fanbases
      const defaults: Community[] = [
        {
          id: 'comm_nolan',
          name: 'Christopher Nolan Fan Club',
          tagline: 'Discussing non-linear structures, practical soundscale, ticking clocks, and deep astrophysics.',
          memberCount: 1420,
          joinedBy: [],
          banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
          posts: [
            {
              id: 'p_nol_1',
              author: 'clara_o',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              body: 'Rewatching Oppenheimer tonight. The silence before the Trinity blast remains the most nerve-wracking moment in modern film history.',
              likes: 42,
              likedBy: [],
              commentsCount: 9,
              timestamp: '3 hours ago'
            },
            {
              id: 'p_nol_2',
              author: 'cooper_n',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              body: 'I still cannot believe Interstellar was snubbed for Best Screenplay. Truly ahead of its timeline.',
              likes: 58,
              likedBy: [],
              commentsCount: 14,
              timestamp: 'Yesterday'
            }
          ]
        },
        {
          id: 'comm_anime',
          name: 'Anime Seekers & Ghibli Lore',
          tagline: 'Dedicated to Ghibli, Shonen masterpiece animations, and beautiful cozy frame-by-frame styles.',
          memberCount: 890,
          joinedBy: [],
          banner: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
          posts: [
            {
              id: 'p_ani_1',
              author: 'cooper_n',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              body: 'Spirited Away’s train sequence is peak cinematic atmospheric relaxation. No dialogue, just Joe Hisaishi’s piano keys.',
              likes: 71,
              likedBy: [],
              commentsCount: 5,
              timestamp: '5 hours ago'
            }
          ]
        },
        {
          id: 'comm_marvel',
          name: 'Marvel Cinematic Devotees',
          tagline: 'Comics breakdown, timeline debates, Multiverse speculation, and upcoming projects tracking.',
          memberCount: 2150,
          joinedBy: [],
          banner: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?w=800',
          posts: [
            {
              id: 'p_mar_1',
              author: 'romils',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              body: 'Is Secret Wars going to top the emotional impact of Endgame? It seems like an impossible task, but Robert Downey Jr coming back is insane.',
              likes: 104,
              likedBy: [],
              commentsCount: 31,
              timestamp: '1 hour ago'
            }
          ]
        },
        {
          id: 'comm_dc',
          name: 'DC Dark Universe League',
          tagline: 'Dark brooding suspense, Gotham shadows, Snyder Cut retrospectives, and James Gunn updates.',
          memberCount: 1100,
          joinedBy: [],
          banner: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
          posts: [
            {
              id: 'p_dc_1',
              author: 'clara_o',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              body: 'Super excited for James Gunn’s Superman. The suit reveals look very classic and hopeful!',
              likes: 35,
              likedBy: [],
              commentsCount: 11,
              timestamp: '2 hours ago'
            }
          ]
        }
      ];
      localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(defaults));
      setCommunities(defaults);
    }
  }, []);

  const handleJoinCommunity = (commId: string) => {
    const updated = communities.map(c => {
      if (c.id !== commId) return c;
      const alreadyJoined = c.joinedBy.includes(userId);
      const joinedBy = alreadyJoined ? c.joinedBy.filter(id => id !== userId) : [...c.joinedBy, userId];
      const memberCount = alreadyJoined ? c.memberCount - 1 : c.memberCount + 1;
      return { ...c, memberCount, joinedBy };
    });
    setCommunities(updated);
    localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(updated));
  };

  const handleLikePost = (commId: string, postId: string) => {
    const updated = communities.map(c => {
      if (c.id !== commId) return c;
      const posts = c.posts.map(p => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likedBy.includes(userId);
        const likedBy = alreadyLiked ? p.likedBy.filter(id => id !== userId) : [...p.likedBy, userId];
        const likes = alreadyLiked ? p.likes - 1 : p.likes + 1;
        return { ...p, likes, likedBy };
      });
      return { ...c, posts };
    });
    setCommunities(updated);
    localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(updated));
  };

  const handleCreatePost = (e: React.FormEvent, commId: string) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const updated = communities.map(c => {
      if (c.id !== commId) return c;
      const newPost: CommunityPost = {
        id: `p_${Date.now()}`,
        author: username,
        avatar: userAvatar,
        body: newPostText,
        likes: 1,
        likedBy: [userId],
        commentsCount: 0,
        timestamp: 'Just now'
      };
      return { ...c, posts: [newPost, ...c.posts] };
    });

    setCommunities(updated);
    localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(updated));
    setNewPostText('');
  };

  const activeComm = communities.find(c => c.id === selectedCommId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white font-sans tracking-tight">Rovix Fanzone Communities™</h3>
          <p className="text-xs text-gray-400 mt-1">
            Connect with specialized cinema fanbases, debate timelines, and share critical insights.
          </p>
        </div>
        {selectedCommId && (
          <button
            onClick={() => setSelectedCommId(null)}
            className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            ← Back to Hub
          </button>
        )}
      </div>

      {!selectedCommId ? (
        /* Grid of available community channels */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map(comm => {
            const isJoined = comm.joinedBy.includes(userId);

            return (
              <div
                key={comm.id}
                className="group bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col justify-between p-6 hover:border-amber-400/30 transition-all duration-300 relative shadow-xl"
              >
                {/* Visual header backdrop banner */}
                <div className="absolute inset-0 z-0 h-[80px]">
                  <img src={comm.banner} alt={comm.name} className="w-full h-full object-cover opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>

                <div className="relative z-10 pt-10 space-y-3">
                  <h4
                    className="text-lg font-black text-white group-hover:text-[#FFD700] transition cursor-pointer"
                    onClick={() => setSelectedCommId(comm.id)}
                  >
                    {comm.name}
                  </h4>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed line-clamp-2">
                    {comm.tagline}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-center pt-4 border-t border-white/5 mt-4 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-amber-400" />
                    {comm.memberCount} Members
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinCommunity(comm.id)}
                      className={`px-3.5 py-1.5 font-bold rounded-lg transition text-[10px] uppercase cursor-pointer ${
                        isJoined
                          ? 'bg-amber-400 text-black shadow-md shadow-amber-400/10'
                          : 'bg-zinc-950 border border-white/5 text-gray-300 hover:text-white'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                    <button
                      onClick={() => setSelectedCommId(comm.id)}
                      className="px-3.5 py-1.5 bg-zinc-900 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-zinc-800 transition cursor-pointer"
                    >
                      Enter Feed
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Community specific feed page */
        activeComm && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feed Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner */}
              <div className="relative h-[120px] rounded-[2rem] overflow-hidden border border-white/5 flex flex-col justify-end p-6">
                <img src={activeComm.banner} alt={activeComm.name} className="absolute inset-0 w-full h-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/30" />
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <h4 className="text-xl font-black text-white">{activeComm.name}</h4>
                    <p className="text-[10px] text-gray-300 font-mono mt-0.5">{activeComm.tagline}</p>
                  </div>
                  <button
                    onClick={() => handleJoinCommunity(activeComm.id)}
                    className={`px-4 py-1.5 font-bold rounded-xl text-xs uppercase transition cursor-pointer ${
                      activeComm.joinedBy.includes(userId)
                        ? 'bg-amber-400 text-black'
                        : 'bg-zinc-950 border border-white/5 text-white hover:text-[#FFD700]'
                    }`}
                  >
                    {activeComm.joinedBy.includes(userId) ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>

              {/* Feed Posts */}
              <div className="space-y-4">
                {activeComm.posts.map(post => {
                  const hasLiked = post.likedBy.includes(userId);

                  return (
                    <div key={post.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2rem] space-y-4 shadow-md">
                      <div className="flex items-center space-x-3">
                        <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-xs text-white">@{post.author}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{post.timestamp}</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{post.body}</p>

                      <div className="flex items-center space-x-4 border-t border-white/5 pt-3 text-xs text-gray-500 font-mono">
                        <button
                          onClick={() => handleLikePost(activeComm.id, post.id)}
                          className={`flex items-center gap-1 cursor-pointer hover:text-white transition ${
                            hasLiked ? 'text-amber-400 font-bold' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes} Likes</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} comments</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write a Post Section */}
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                <h5 className="font-bold text-sm text-white font-sans flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400" /> Write Community Post
                </h5>
                <form onSubmit={(e) => handleCreatePost(e, activeComm.id)} className="space-y-3">
                  <textarea
                    required
                    value={newPostText}
                    onChange={e => setNewPostText(e.target.value)}
                    placeholder="Broadcast news, casts gossip, movie ratings, or trivia points to this fanbase..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-3.5 text-xs text-white focus:border-amber-400 outline-none leading-relaxed"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-lg shadow-amber-400/10 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post to Fanbase</span>
                  </button>
                </form>
              </div>

              {/* Rules and Guidelines */}
              <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] text-xs font-mono text-gray-400 space-y-3">
                <h5 className="font-sans font-bold text-gray-300">Hub Guild Laws</h5>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>No toxic/hateful speech</li>
                  <li>No unflagged major plot spoilers</li>
                  <li>Always respect other opinions</li>
                  <li>Keep discussions related to film/TV</li>
                </ul>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
