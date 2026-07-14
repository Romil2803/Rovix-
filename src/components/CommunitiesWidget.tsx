import React, { useState, useEffect } from 'react';
import { 
  Users, Heart, MessageSquare, Plus, CheckCircle2, Flame, Send, 
  Share2, ShieldAlert, EyeOff, BarChart2, Check, Copy, Sparkles, X, AlertTriangle 
} from 'lucide-react';
import { 
  getCommunityPosts, createCommunityPost, likeCommunityPost, 
  voteInCommunityPoll, addCommunityComment, reportCommunityContent,
  getCurrentUser, awardXP
} from '../db/storage';
import { Community, CommunityPost, CommunityComment } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { increment } from 'firebase/firestore';

interface CommunitiesWidgetProps {
  userId: string;
  username: string;
  userAvatar: string;
  onMovieClick: (id: string, isTv: boolean) => void;
}

// Complete 12 Requested Communities
const COMMUNITIES_LIST: Community[] = [
  {
    id: 'comm_marvel',
    name: 'Marvel Universe',
    tagline: 'Comics lore, multiverse speculations, character arcs, and movie reviews.',
    memberCount: 3420,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?w=800&auto=format&fit=crop&q=60',
    icon: '🔴'
  },
  {
    id: 'comm_dc',
    name: 'DC Comics League',
    tagline: 'Brooding vigilantes, James Gunn slate updates, Snyder Cut retrospectives.',
    memberCount: 2150,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=60',
    icon: '🦇'
  },
  {
    id: 'comm_bollywood',
    name: 'Bollywood Tadka',
    tagline: 'Song-and-dance spectacles, high-octane drama, masala reviews, and industry gossip.',
    memberCount: 2890,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1599831011116-2187b40106ca?w=800&auto=format&fit=crop&q=60',
    icon: '💃'
  },
  {
    id: 'comm_hollywood',
    name: 'Hollywood Spotlights',
    tagline: 'Academy Awards tracking, indie blockbusters, auteur analysis, and studio news.',
    memberCount: 4120,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60',
    icon: '🎬'
  },
  {
    id: 'comm_anime',
    name: 'Anime Seekers & Ghibli Lore',
    tagline: 'Ghibli atmosphere, Shonen updates, aesthetic animations, and cozy frame-by-frame discussions.',
    memberCount: 1980,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=60',
    icon: '🌸'
  },
  {
    id: 'comm_kdrama',
    name: 'K-Drama Craze',
    tagline: 'Heartwarming romances, thrilling suspense, Seoul aesthetics, and OST listening rooms.',
    memberCount: 1750,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
    icon: '🫰'
  },
  {
    id: 'comm_southindian',
    name: 'South Indian Blockbusters',
    tagline: 'Tollywood, Kollywood, Sandalwood, and Mollywood cinematic masterpieces, gravity-defying action, and folklore.',
    memberCount: 2540,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?w=800&auto=format&fit=crop&q=60',
    icon: '🔥'
  },
  {
    id: 'comm_horror',
    name: 'Horror & Suspense Hub',
    tagline: 'Jumpscares, demonic possessions, psychological thrillers, and found-footage hidden gems.',
    memberCount: 2130,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?w=800&auto=format&fit=crop&q=60',
    icon: '👁️'
  },
  {
    id: 'comm_scifi',
    name: 'Sci-Fi & Cosmic Travel',
    tagline: 'Warp-speed physics, space exploration, artificial intelligence, cybernetics, and time travel mechanics.',
    memberCount: 3100,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
    icon: '🚀'
  },
  {
    id: 'comm_nolan',
    name: 'Christopher Nolan Fan Club',
    tagline: 'Practical scale, non-linear clocks, atmospheric bass drops, and ticking timelines.',
    memberCount: 3820,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=60',
    icon: '⏳'
  },
  {
    id: 'comm_mcu',
    name: 'MCU Timeline Devotees',
    tagline: 'Every timeline branch, continuity checks, Easter eggs, and Avengers saga progression.',
    memberCount: 2950,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=800&auto=format&fit=crop&q=60',
    icon: '🛡️'
  },
  {
    id: 'comm_starwars',
    name: 'Star Wars Galactic Council',
    tagline: 'Force theories, lightsaber duels, bounty hunter logs, and expanded universe lore.',
    memberCount: 2240,
    joinedBy: [],
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60',
    icon: '🌌'
  }
];

export default function CommunitiesWidget({ userId, username, userAvatar, onMovieClick }: CommunitiesWidgetProps) {
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, string[]>>({});
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
  
  // Create Post States
  const [newPostText, setNewPostText] = useState('');
  const [isSpoilerPost, setIsSpoilerPost] = useState(false);
  const [isPollPost, setIsPollPost] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Interaction States
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentSpoilerFlags, setCommentSpoilerFlags] = useState<Record<string, boolean>>({});

  // Share Modal States
  const [sharePost, setSharePost] = useState<CommunityPost | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Report Modal States
  const [reportingItem, setReportingItem] = useState<{ id: string; type: 'post' | 'comment' } | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Experience Notification Toast
  const [xpToast, setXpToast] = useState<string | null>(null);

  // Load user community join state from LocalStorage or Firestore
  useEffect(() => {
    const cachedJoined = localStorage.getItem(`joined_communities_${userId}`);
    if (cachedJoined) {
      setJoinedCommunities(JSON.parse(cachedJoined));
    } else {
      const initial: Record<string, string[]> = {};
      COMMUNITIES_LIST.forEach(c => {
        initial[c.id] = [];
      });
      localStorage.setItem(`joined_communities_${userId}`, JSON.stringify(initial));
      setJoinedCommunities(initial);
    }
  }, [userId]);

  const showXpToast = (message: string) => {
    setXpToast(message);
    setTimeout(() => setXpToast(null), 3000);
  };

  const handleJoinCommunity = (commId: string) => {
    const list = joinedCommunities[commId] || [];
    const isJoined = list.includes(userId);
    let updatedList: string[];

    if (isJoined) {
      updatedList = list.filter(id => id !== userId);
      showXpToast('Left Community 👥');
    } else {
      updatedList = [...list, userId];
      awardXP(userId, 10, 'joining a fanzone community');
      showXpToast('+10 XP Earned! Joined Community! 🎉');
    }

    const updated = { ...joinedCommunities, [commId]: updatedList };
    setJoinedCommunities(updated);
    localStorage.setItem(`joined_communities_${userId}`, JSON.stringify(updated));

    // Update in Firebase if desired (optional background sync)
    updateDoc(doc(db, 'users', userId), {
      favoriteGenres: updatedList.includes(userId) ? [commId] : []
    }).catch(() => {});
  };

  const handleCreatePostSubmit = async (e: React.FormEvent, commId: string) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    if (isPollPost && (!pollQuestion.trim() || pollOptions.some(o => !o.trim()))) {
      alert('Please fill out the poll question and all options!');
      return;
    }

    await createCommunityPost(
      commId,
      userId,
      username,
      userAvatar,
      newPostText,
      isSpoilerPost,
      isPollPost,
      isPollPost ? pollQuestion : undefined,
      isPollPost ? pollOptions.filter(o => o.trim() !== '') : undefined
    );

    // Reset Form
    setNewPostText('');
    setIsSpoilerPost(false);
    setIsPollPost(false);
    setPollQuestion('');
    setPollOptions(['', '']);

    showXpToast('+30 XP Earned! Post Shared! 🚀');
  };

  const handleLikePostClick = async (postId: string) => {
    await likeCommunityPost(postId, userId);
    showXpToast('+5 XP Earned! Liked Post! ❤️');
  };

  const handleVoteClick = async (postId: string, optionIdx: number) => {
    await voteInCommunityPoll(postId, optionIdx, userId);
    showXpToast('+10 XP Earned! Casted Vote! 📊');
  };

  const handleAddCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const txt = commentInputs[postId] || '';
    if (!txt.trim()) return;

    const isSpoiler = commentSpoilerFlags[postId] || false;

    await addCommunityComment(postId, userId, username, userAvatar, txt, isSpoiler);

    // Reset comments forms
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setCommentSpoilerFlags(prev => ({ ...prev, [postId]: false }));
    showXpToast('+15 XP Earned! Reply Shared! 💬');
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingItem || !reportReason.trim()) return;

    await reportCommunityContent(
      userId,
      reportingItem.id,
      reportingItem.type,
      reportReason,
      selectedCommId || undefined
    );

    alert(`Content has been flagged and submitted to Rovix Moderators. Thank you for maintaining a clean community!`);
    setReportingItem(null);
    setReportReason('');
  };

  const handleShareClick = (post: CommunityPost) => {
    setSharePost(post);
  };

  const handleCopyLink = () => {
    if (!sharePost) return;
    const shareText = `🎬 @${sharePost.authorUsername} in Rovix ${selectedCommId?.replace('comm_', '').toUpperCase()}: "${sharePost.body.substring(0, 80)}..."\nCheck it out here: http://localhost:3000/community/${selectedCommId}/${sharePost.id}`;
    navigator.clipboard.writeText(shareText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const activeComm = COMMUNITIES_LIST.find(c => c.id === selectedCommId);
  const rawPosts = getCommunityPosts(selectedCommId || undefined);
  // Hide reported posts in user client feed unless user is admin
  const currentUserObj = getCurrentUser();
  const isAdmin = currentUserObj?.isAdmin || false;
  const commPosts = rawPosts.filter(p => !p.isReported || isAdmin);

  return (
    <div className="space-y-6">
      {/* XP Toast Notification */}
      {xpToast && (
        <div className="fixed top-24 right-6 bg-[#F5C518] text-black px-5 py-3 rounded-2xl font-black shadow-2xl z-50 animate-bounce flex items-center space-x-2 border border-white/10 text-xs">
          <span>{xpToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white font-sans tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#F5C518]" />
            <span>ROVIX FANZONE HUBS</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Connect with 12 specialized movie fanbases. Create posts, vote in polls, and discuss cinema safely!
          </p>
        </div>
        {selectedCommId && (
          <button
            onClick={() => {
              setSelectedCommId(null);
              setExpandedCommentsPostId(null);
            }}
            className="px-4 py-2 bg-zinc-900 border border-white/10 hover:border-[#F5C518] text-white hover:text-[#F5C518] font-mono font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 self-start"
          >
            ← BACK TO COMMUNITIES
          </button>
        )}
      </div>

      {!selectedCommId ? (
        /* Grid of 12 communities */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMMUNITIES_LIST.map(comm => {
            const list = joinedCommunities[comm.id] || [];
            const isJoined = list.includes(userId);
            const displayMemberCount = comm.memberCount + list.length;

            return (
              <div
                key={comm.id}
                className="group relative bg-zinc-950/80 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col justify-between p-6 hover:border-[#F5C518]/30 transition-all duration-300 shadow-xl"
              >
                {/* Banner backdrop header */}
                <div className="absolute inset-x-0 top-0 z-0 h-28">
                  <img src={comm.banner} alt={comm.name} className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                </div>

                <div className="relative z-10 pt-16 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{comm.icon}</span>
                    <h3
                      className="text-lg font-black text-white group-hover:text-[#F5C518] transition cursor-pointer font-sans"
                      onClick={() => setSelectedCommId(comm.id)}
                    >
                      {comm.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed line-clamp-3 h-12 font-medium">
                    {comm.tagline}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-center pt-4 border-t border-white/5 mt-5 text-[10px] font-mono text-gray-400">
                  <span className="flex items-center gap-1 font-bold">
                    <Users className="w-3.5 h-3.5 text-[#F5C518]" />
                    {displayMemberCount.toLocaleString()} MEMBERS
                  </span>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleJoinCommunity(comm.id)}
                      className={`px-3 py-1.5 font-bold rounded-lg transition text-[10px] uppercase cursor-pointer ${
                        isJoined
                          ? 'bg-[#F5C518] text-black shadow-md shadow-[#F5C518]/10'
                          : 'bg-zinc-900 border border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                    <button
                      onClick={() => setSelectedCommId(comm.id)}
                      className="px-3 py-1.5 bg-zinc-900 text-white border border-white/5 font-bold rounded-lg hover:bg-[#F5C518] hover:text-black transition cursor-pointer"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Community Page layout */
        activeComm && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Main Column: Broadcast and Posts list */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dynamic Header Banner */}
              <div className="relative h-40 rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col justify-end p-6 md:p-8">
                <img src={activeComm.banner} alt={activeComm.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-black/30 z-0" />
                <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{activeComm.icon}</span>
                      <h3 className="text-2xl font-black text-white font-sans">{activeComm.name} Fanzone</h3>
                    </div>
                    <p className="text-xs text-gray-300 max-w-xl font-medium">{activeComm.tagline}</p>
                  </div>
                  <button
                    onClick={() => handleJoinCommunity(activeComm.id)}
                    className={`px-5 py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer self-start md:self-end ${
                      (joinedCommunities[activeComm.id] || []).includes(userId)
                        ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/20'
                        : 'bg-zinc-950 border border-white/10 text-white hover:border-[#F5C518] hover:text-[#F5C518]'
                    }`}
                  >
                    {(joinedCommunities[activeComm.id] || []).includes(userId) ? 'Joined Hub' : 'Join Community'}
                  </button>
                </div>
              </div>

              {/* Feed posts list */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
                    Fanbase Posts ({commPosts.length})
                  </h4>
                  {commPosts.length === 0 && (
                    <span className="text-[10px] text-zinc-500 italic">No posts yet. Be the first!</span>
                  )}
                </div>

                {commPosts.map(post => {
                  const hasLiked = post.likedBy.includes(userId);
                  const isCommentsExpanded = expandedCommentsPostId === post.id;
                  const isPostSpoiler = post.isSpoiler || false;
                  
                  return (
                    <div 
                      key={post.id} 
                      className={`bg-[#111111]/90 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl hover:border-white/10 transition-all duration-300 relative ${
                        post.isReported ? 'border-red-500/30 bg-red-950/5' : ''
                      }`}
                    >
                      {/* Flag Indicator for Admin */}
                      {post.isReported && isAdmin && (
                        <div className="absolute top-4 right-4 bg-red-500 text-black px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Reported Content
                        </div>
                      )}

                      {/* Author Specs */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <img src={post.authorAvatar} alt={post.authorUsername} className="w-9 h-9 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-xs text-white">@{post.authorUsername}</p>
                            <p className="text-[9px] text-gray-500 font-mono font-semibold uppercase">
                              {new Date(post.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Top action: Report / Share */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleShareClick(post)}
                            className="p-1.5 bg-zinc-900 border border-white/5 hover:border-[#F5C518]/30 rounded-lg text-gray-400 hover:text-white transition"
                            title="Share Post"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setReportingItem({ id: post.id, type: 'post' })}
                            className="p-1.5 bg-zinc-900 border border-white/5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition"
                            title="Report Post"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Post body, with Spoiler Redacted Blur */}
                      <div className="space-y-3">
                        {isPostSpoiler ? (
                          <SpoilerPostSection body={post.body} />
                        ) : (
                          <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                            {post.body}
                          </p>
                        )}
                      </div>

                      {/* Poll Section if present */}
                      {post.isPoll && post.pollOptions && (
                        <div className="bg-zinc-950 p-4.5 rounded-2xl border border-white/5 space-y-3">
                          <p className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-[#F5C518]" />
                            <span>POLL: {post.pollQuestion}</span>
                          </p>
                          
                          {(() => {
                            const totalVotes = post.pollOptions.reduce((acc, opt) => acc + opt.votes, 0);
                            const userVotedOptIdx = post.pollOptions.findIndex(o => o.votedBy.includes(userId));
                            const hasUserVoted = userVotedOptIdx !== -1;

                            return (
                              <div className="space-y-2 text-xs">
                                {post.pollOptions.map((opt, oIdx) => {
                                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                  const isSelected = userVotedOptIdx === oIdx;

                                  return (
                                    <div key={oIdx} className="relative">
                                      <button
                                        disabled={hasUserVoted}
                                        onClick={() => handleVoteClick(post.id, oIdx)}
                                        className={`w-full text-left p-3 rounded-xl border font-sans relative overflow-hidden transition ${
                                          hasUserVoted 
                                            ? 'cursor-default border-white/5 bg-zinc-900/20' 
                                            : 'cursor-pointer border-white/5 bg-zinc-900 hover:border-[#F5C518]/30 hover:bg-zinc-850'
                                        }`}
                                      >
                                        {/* Colored percentage fill background */}
                                        {hasUserVoted && (
                                          <div 
                                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                                              isSelected ? 'bg-[#F5C518]/15' : 'bg-white/5'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        )}

                                        <div className="relative z-10 flex justify-between items-center font-semibold">
                                          <span className="text-gray-200 flex items-center gap-1.5">
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F5C518]" />}
                                            {opt.text}
                                          </span>
                                          {hasUserVoted && (
                                            <span className="text-[#F5C518] font-mono">{pct}% ({opt.votes})</span>
                                          )}
                                        </div>
                                      </button>
                                    </div>
                                  );
                                })}

                                <p className="text-[9px] text-zinc-500 font-mono text-right font-bold uppercase mt-1">
                                  Total Votes Cast: {totalVotes.toLocaleString()}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Bottom Interactivity rail: Liking, Replies toggle */}
                      <div className="flex items-center space-x-6 pt-3 border-t border-white/5 text-[11px] text-gray-500 font-mono">
                        <button
                          onClick={() => handleLikePostClick(post.id)}
                          className={`flex items-center gap-1.5 cursor-pointer hover:text-white transition ${
                            hasLiked ? 'text-red-400 font-bold' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes} LIKES</span>
                        </button>
                        <button
                          onClick={() => setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)}
                          className="flex items-center gap-1.5 cursor-pointer hover:text-white transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount} REPLIES</span>
                        </button>
                      </div>

                      {/* Expandable replies list */}
                      {isCommentsExpanded && (
                        <div className="bg-zinc-950/40 p-4 rounded-3xl border border-white/5 space-y-4 animate-fadeIn">
                          <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                            Discussion Thread ({post.commentsCount})
                          </p>
                          
                          {/* Replies feeds */}
                          <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                            {!post.comments || post.comments.length === 0 ? (
                              <p className="text-center py-4 text-zinc-600 text-[11px] italic">
                                No replies on this thread. Speak up and share your voice!
                              </p>
                            ) : (
                              post.comments.map(comm => (
                                <div key={comm.id} className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-start space-x-3">
                                  <img src={comm.authorAvatar} alt={comm.authorUsername} className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10" referrerPolicy="no-referrer" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="font-bold text-[#F5C518]">@{comm.authorUsername}</span>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => setReportingItem({ id: comm.id, type: 'comment' })}
                                          className="text-gray-600 hover:text-red-400 transition"
                                          title="Report comment"
                                        >
                                          Flag
                                        </button>
                                        <span className="text-gray-500">Just now</span>
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                      {comm.isSpoiler ? (
                                        <SpoilerPostSection body={comm.body} size="xs" />
                                      ) : (
                                        <p className="text-gray-300 text-xs leading-relaxed break-words">{comm.body}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Post reply form */}
                          <form onSubmit={(e) => handleAddCommentSubmit(e, post.id)} className="space-y-3 pt-3 border-t border-white/5">
                            <input
                              type="text"
                              required
                              value={commentInputs[post.id] || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setCommentInputs(prev => ({ ...prev, [post.id]: val }));
                              }}
                              placeholder="Write a respectful reply..."
                              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#F5C518] outline-none"
                            />
                            <div className="flex justify-between items-center">
                              <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={commentSpoilerFlags[post.id] || false}
                                  onChange={e => {
                                    const val = e.target.checked;
                                    setCommentSpoilerFlags(prev => ({ ...prev, [post.id]: val }));
                                  }}
                                  className="accent-[#F5C518]"
                                />
                                <span className="flex items-center gap-0.5 text-red-400 font-bold">
                                  <EyeOff className="w-3 h-3" /> Spoiler Warning
                                </span>
                              </label>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-mono font-bold text-[10px] rounded-lg transition cursor-pointer uppercase flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" /> Post Reply
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Create Post & Guidelines */}
            <div className="space-y-6">
              {/* Create Post Card */}
              <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                <h5 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#F5C518]" />
                  <span>BROADCAST NEWS</span>
                </h5>
                
                <form onSubmit={(e) => handleCreatePostSubmit(e, activeComm.id)} className="space-y-4">
                  <div>
                    <textarea
                      required
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      placeholder={`Draft news, casting gossip, theories, or details for this fanbase...`}
                      rows={4}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-3 text-xs text-white focus:border-[#F5C518] outline-none leading-relaxed resize-none"
                    />
                  </div>

                  {/* Toggle: Create a Poll */}
                  <div className="border-t border-b border-white/5 py-3 space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsPollPost(!isPollPost)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition ${
                        isPollPost ? 'text-[#F5C518]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" />
                      <span>{isPollPost ? 'Remove Interactive Poll' : 'Add Interactive Poll'}</span>
                    </button>

                    {isPollPost && (
                      <div className="space-y-2.5 animate-fadeIn bg-zinc-950 p-4.5 rounded-2xl border border-white/5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Poll Question</label>
                          <input
                            type="text"
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                            placeholder="e.g. Which franchise timeline is best?"
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#F5C518] outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Poll Options</label>
                          {pollOptions.map((opt, oIdx) => (
                            <div key={oIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPollOptions(pollOptions.map((v, i) => i === oIdx ? val : v));
                                }}
                                placeholder={`Option ${oIdx + 1}`}
                                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#F5C518] outline-none"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePollOption(oIdx)}
                                  className="text-red-400 text-xs font-bold hover:underline"
                                >
                                  Del
                                </button>
                              )}
                            </div>
                          ))}

                          {pollOptions.length < 5 && (
                            <button
                              type="button"
                              onClick={handleAddPollOption}
                              className="text-xs text-zinc-400 hover:text-[#F5C518] flex items-center gap-1 mt-1 font-semibold"
                            >
                              + Add Option (Max 5)
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spoilers checklist */}
                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-1.5 text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSpoilerPost}
                        onChange={e => setIsSpoilerPost(e.target.checked)}
                        className="accent-[#F5C518]"
                      />
                      <span className="flex items-center gap-0.5 text-red-400 font-bold">
                        <EyeOff className="w-3.5 h-3.5" /> Contains Spoilers
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#F5C518] hover:bg-[#F5C518]/95 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-[#F5C518]/15 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Feed</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Guidelines */}
              <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2.5rem] space-y-4 text-xs font-mono text-zinc-400">
                <h5 className="font-sans font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#F5C518]" />
                  <span>HUB GUILD LAWS</span>
                </h5>
                <ul className="list-decimal list-inside space-y-2">
                  <li>Respect diverse film opinions; no toxic bashing.</li>
                  <li>Always use <span className="text-red-400 font-bold">Spoiler Tags</span> for major plot twists and ending reviews.</li>
                  <li>Keep content focused on this codebase topic.</li>
                  <li>Report toxic content; moderators audit the moderation queue.</li>
                </ul>
              </div>
            </div>
          </div>
        )
      )}

      {/* MODAL: REPORT REASON MODAL */}
      {reportingItem && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-[2.5rem] max-w-md w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-sans font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Report Inappropriate Content
              </h4>
              <button onClick={() => setReportingItem(null)} className="p-1 hover:text-red-400 text-gray-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <p className="text-gray-300">
                You are flagging a fanzone {reportingItem.type} for moderation. Please specify the violation details below:
              </p>
              <div>
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block mb-1">Reason for Flagging</label>
                <textarea
                  required
                  rows={3}
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="e.g., Profanity, unflagged spoilers, abusive speech, spam..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-red-400 outline-none resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2 text-[10px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setReportingItem(null)}
                  className="px-4 py-2 bg-zinc-900 text-gray-400 rounded-lg hover:bg-zinc-850"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  SUBMIT FLAG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SHARE PREVIEW CARD */}
      {sharePost && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-black border border-white/10 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl animate-scaleIn">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-white/5">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#F5C518]" /> Share to Socials
              </span>
              <button onClick={() => setSharePost(null)} className="text-gray-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated X / Instagram mock post card wrapper */}
            <div className="p-6">
              <div className="bg-[#111111] p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C518]/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Simulated App Identity */}
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span className="font-bold text-white tracking-widest">ROVIX FANZONE</span>
                  <span>COMMUNITY FEED</span>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <img src={sharePost.authorAvatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-[#F5C518]/30 shadow-md" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-xs text-white">@{sharePost.authorUsername}</p>
                    <p className="text-[8px] text-zinc-500 font-mono uppercase">Level {currentUserObj?.level || 1} Cinephile</p>
                  </div>
                </div>

                <p className="text-gray-200 text-xs italic leading-relaxed pt-2">
                  "{sharePost.body}"
                </p>

                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-3 mt-4">
                  <span>LIKES: {sharePost.likes}</span>
                  <span>REPLIES: {sharePost.commentsCount}</span>
                </div>
              </div>

              {/* Copy links */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#F5C518]/15 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedNotification ? 'COPIED TO CLIPBOARD!' : 'COPY PRESET SHARE TEXT'}</span>
                </button>
                <p className="text-[10px] text-center text-zinc-500 font-mono">
                  Ready to share on Instagram Stories, Threads, or X (Twitter)!
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Sub-component: Spoiler Blur Card
function SpoilerPostSection({ body, size = 'md' }: { body: string; size?: 'xs' | 'md' }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div className="space-y-2 animate-fadeIn">
        <p className={`text-gray-300 leading-relaxed ${size === 'xs' ? 'text-xs' : 'text-xs md:text-sm whitespace-pre-wrap'}`}>
          {body}
        </p>
        <button onClick={() => setRevealed(false)} className="text-[10px] text-[#F5C518] font-bold font-mono tracking-widest uppercase cursor-pointer block hover:underline">
          Hide Spoiler Overlay [!]
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 p-4.5 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center space-y-3.5 text-center my-1 select-none">
      <div className="flex items-center gap-1.5 text-red-400 font-bold tracking-wide text-[11px] font-mono uppercase">
        <EyeOff className="w-4 h-4 animate-pulse" />
        <span>Spoiler Redacted Block</span>
      </div>
      <button
        onClick={() => setRevealed(true)}
        className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white font-mono font-bold rounded-xl text-[10px] uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer transition"
      >
        Reveal Message
      </button>
    </div>
  );
}
