import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, EyeOff, ThumbsUp, Plus, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

interface DiscussionHubWidgetProps {
  movieId: string;
  userId: string;
  username: string;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  userVotedIdx?: number;
}

interface Theory {
  id: string;
  author: string;
  body: string;
  likes: number;
  likedBy: string[];
}

interface Quote {
  id: string;
  quote: string;
  character: string;
  votes: number;
  votedBy: string[];
}

interface ThreadMessage {
  id: string;
  author: string;
  body: string;
  isSpoiler: boolean;
  timestamp: string;
}

export default function DiscussionHubWidget({ movieId, userId, username }: DiscussionHubWidgetProps) {
  const [activeSubTab, setActiveSubTab] = useState<'threads' | 'theories' | 'polls' | 'quotes'>('threads');

  // Persistence keys
  const POLLS_KEY = `rovix_polls_${movieId}`;
  const THEORIES_KEY = `rovix_theories_${movieId}`;
  const QUOTES_KEY = `rovix_quotes_${movieId}`;
  const THREADS_KEY = `rovix_threads_${movieId}`;

  // State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [threads, setThreads] = useState<ThreadMessage[]>([]);

  // Input states
  const [newComment, setNewComment] = useState('');
  const [newCommentSpoiler, setNewCommentSpoiler] = useState(false);

  const [newTheory, setNewTheory] = useState('');
  
  const [newQuote, setNewQuote] = useState('');
  const [newQuoteChar, setNewQuoteChar] = useState('');

  // Initial Seed Data if not already present
  useEffect(() => {
    // 1. Seed Polls
    const cachedPolls = localStorage.getItem(POLLS_KEY);
    if (cachedPolls) {
      setPolls(JSON.parse(cachedPolls));
    } else {
      const defaultPolls: Poll[] = [
        {
          id: 'poll_1',
          question: 'Was the final ending cliffhanger perfectly executed?',
          options: [
            { text: 'Absolute cinematic genius', votes: 42 },
            { text: 'A bit frustrating but satisfying', votes: 24 },
            { text: 'Unnecessarily confusing', votes: 11 }
          ]
        },
        {
          id: 'poll_2',
          question: 'Which creative category stood out the most?',
          options: [
            { text: 'Cinematography & Lighting', votes: 53 },
            { text: 'Music Composition & Soundscale', votes: 89 },
            { text: 'Performance Cast acting', votes: 31 },
            { text: 'Direction & Screenplay structural pacing', votes: 19 }
          ]
        }
      ];
      localStorage.setItem(POLLS_KEY, JSON.stringify(defaultPolls));
      setPolls(defaultPolls);
    }

    // 2. Seed Theories
    const cachedTheories = localStorage.getItem(THEORIES_KEY);
    if (cachedTheories) {
      setTheories(JSON.parse(cachedTheories));
    } else {
      const defaultTheories: Theory[] = [
        {
          id: 'theory_1',
          author: 'clara_o',
          body: 'The protagonist was dreaming during the entire second act, and the clues are hidden in the sound design echoes.',
          likes: 18,
          likedBy: []
        },
        {
          id: 'theory_2',
          author: 'cooper_n',
          body: 'The color palette shifts from cool blue to amber gold to indicate a parallel timeline bifurcation!',
          likes: 31,
          likedBy: []
        }
      ];
      localStorage.setItem(THEORIES_KEY, JSON.stringify(defaultTheories));
      setTheories(defaultTheories);
    }

    // 3. Seed Quotes
    const cachedQuotes = localStorage.getItem(QUOTES_KEY);
    if (cachedQuotes) {
      setQuotes(JSON.parse(cachedQuotes));
    } else {
      const defaultQuotes: Quote[] = [
        {
          id: 'quote_1',
          quote: 'We dream in stars, but we live in the deep dark.',
          character: 'The Navigator',
          votes: 28,
          votedBy: []
        },
        {
          id: 'quote_2',
          quote: 'Time is not a circle. It is an ocean waiting to crash.',
          character: 'Commander Hayes',
          votes: 41,
          votedBy: []
        }
      ];
      localStorage.setItem(QUOTES_KEY, JSON.stringify(defaultQuotes));
      setQuotes(defaultQuotes);
    }

    // 4. Seed Threads / Chat
    const cachedThreads = localStorage.getItem(THREADS_KEY);
    if (cachedThreads) {
      setThreads(JSON.parse(cachedThreads));
    } else {
      const defaultThreads: ThreadMessage[] = [
        {
          id: 'msg_1',
          author: 'romils',
          body: 'Can we talk about the incredible score during the black hole sequence? Instant chills.',
          isSpoiler: false,
          timestamp: '2 hours ago'
        },
        {
          id: 'msg_2',
          author: 'clara_o',
          body: 'The third act twist changes literally everything. Hover your cursor or tap me to read! Clara reveals the protagonist was actually the antagonist’s father.',
          isSpoiler: true,
          timestamp: '1 hour ago'
        }
      ];
      localStorage.setItem(THREADS_KEY, JSON.stringify(defaultThreads));
      setThreads(defaultThreads);
    }
  }, [movieId]);

  // Actions
  const handleVote = (pollId: string, optionIdx: number) => {
    const updated = polls.map(p => {
      if (p.id !== pollId) return p;
      if (p.userVotedIdx !== undefined) return p; // prevent double voting
      const options = p.options.map((opt, idx) => {
        if (idx === optionIdx) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });
      return { ...p, options, userVotedIdx: optionIdx };
    });
    setPolls(updated);
    localStorage.setItem(POLLS_KEY, JSON.stringify(updated));
  };

  const handleLikeTheory = (theoryId: string) => {
    const updated = theories.map(t => {
      if (t.id !== theoryId) return t;
      const alreadyLiked = t.likedBy.includes(userId);
      const likedBy = alreadyLiked ? t.likedBy.filter(id => id !== userId) : [...t.likedBy, userId];
      const likes = alreadyLiked ? t.likes - 1 : t.likes + 1;
      return { ...t, likes, likedBy };
    });
    setTheories(updated);
    localStorage.setItem(THEORIES_KEY, JSON.stringify(updated));
  };

  const handleVoteQuote = (quoteId: string) => {
    const updated = quotes.map(q => {
      if (q.id !== quoteId) return q;
      const alreadyVoted = q.votedBy.includes(userId);
      const votedBy = alreadyVoted ? q.votedBy.filter(id => id !== userId) : [...q.votedBy, userId];
      const votes = alreadyVoted ? q.votes - 1 : q.votes + 1;
      return { ...q, votes, votedBy };
    });
    setQuotes(updated);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const msg: ThreadMessage = {
      id: `msg_${Date.now()}`,
      author: username,
      body: newComment,
      isSpoiler: newCommentSpoiler,
      timestamp: 'Just now'
    };
    const updated = [...threads, msg];
    setThreads(updated);
    localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
    setNewComment('');
    setNewCommentSpoiler(false);
  };

  const handleAddTheory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheory.trim()) return;
    const theory: Theory = {
      id: `theory_${Date.now()}`,
      author: username,
      body: newTheory,
      likes: 1,
      likedBy: [userId]
    };
    const updated = [...theories, theory];
    setTheories(updated);
    localStorage.setItem(THEORIES_KEY, JSON.stringify(updated));
    setNewTheory('');
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim() || !newQuoteChar.trim()) return;
    const q: Quote = {
      id: `quote_${Date.now()}`,
      quote: newQuote,
      character: newQuoteChar,
      votes: 1,
      votedBy: [userId]
    };
    const updated = [...quotes, q];
    setQuotes(updated);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(updated));
    setNewQuote('');
    setNewQuoteChar('');
  };

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
      {/* Tab select bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-3">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <span>Fanzone Discussion Hub™</span>
        </h3>
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-full border border-white/5">
          {(['threads', 'theories', 'polls', 'quotes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold capitalize transition cursor-pointer ${
                activeSubTab === tab ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 1. THREADS GENERAL & SPOILERS */}
      {activeSubTab === 'threads' && (
        <div className="space-y-4">
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {threads.map(msg => (
              <div key={msg.id} className="bg-zinc-950/40 border border-white/5 p-3.5 rounded-2xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">@{msg.author}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{msg.timestamp}</span>
                </div>
                {msg.isSpoiler ? (
                  <SpoilerText text={msg.body} />
                ) : (
                  <p className="text-gray-200 text-xs md:text-sm leading-relaxed">{msg.body}</p>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="space-y-3 pt-2">
            <textarea
              required
              rows={2}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Post a lore reaction, comment, or trivia point..."
              className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setNewCommentSpoiler(!newCommentSpoiler)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold border transition ${
                  newCommentSpoiler ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'text-gray-400 border-white/5'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mark as Spoiler</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-lg shadow-amber-400/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Post</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. THEORIES */}
      {activeSubTab === 'theories' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {theories.map(th => (
              <div key={th.id} className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#FFD700]">Theory by @{th.author}</span>
                  <button
                    onClick={() => handleLikeTheory(th.id)}
                    className={`flex items-center gap-1 font-mono font-semibold transition ${
                      th.likedBy.includes(userId) ? 'text-amber-400' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{th.likes} upvotes</span>
                  </button>
                </div>
                <p className="text-gray-200 text-xs md:text-sm leading-relaxed">{th.body}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTheory} className="space-y-3">
            <input
              type="text"
              required
              value={newTheory}
              onChange={e => setNewTheory(e.target.value)}
              placeholder="Describe a compelling plot theory, symbolism, or sequel predictions..."
              className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share Fan Theory</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. POLLS */}
      {activeSubTab === 'polls' && (
        <div className="space-y-4">
          {polls.map(p => {
            const totalVotes = p.options.reduce((acc, curr) => acc + curr.votes, 0) || 1;
            const hasVoted = p.userVotedIdx !== undefined;

            return (
              <div key={p.id} className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  {p.question}
                </h4>
                <div className="space-y-2">
                  {p.options.map((opt, oIdx) => {
                    const percentage = Math.round((opt.votes / totalVotes) * 100);
                    const isSelected = p.userVotedIdx === oIdx;

                    return (
                      <button
                        key={oIdx}
                        disabled={hasVoted}
                        onClick={() => handleVote(p.id, oIdx)}
                        className={`w-full relative overflow-hidden p-3 rounded-xl border text-left flex justify-between items-center text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                            : 'border-white/5 bg-zinc-900/30 text-gray-300 hover:border-white/10'
                        }`}
                      >
                        {/* Background filler for voted states */}
                        {hasVoted && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-white/[0.03] transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {opt.text}
                        </span>
                        <span className="relative z-10 font-mono font-bold text-[10px] text-gray-400">
                          {opt.votes} ({percentage}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. QUOTES */}
      {activeSubTab === 'quotes' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {quotes.map(q => (
              <div key={q.id} className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <p className="text-gray-200 italic font-serif text-sm">"{q.quote}"</p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">— {q.character}</p>
                </div>
                <button
                  onClick={() => handleVoteQuote(q.id)}
                  className={`px-3 py-2 border rounded-xl flex flex-col items-center justify-center min-w-[50px] transition font-mono text-xs ${
                    q.votedBy.includes(userId)
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3 mb-1" />
                  <span>{q.votes}</span>
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddQuote} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newQuote}
                onChange={e => setNewQuote(e.target.value)}
                placeholder="Quote text (e.g. I will return...)"
                className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={newQuoteChar}
                onChange={e => setNewQuoteChar(e.target.value)}
                placeholder="Character speaker name"
                className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Movie Quote</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Sub-component for blurring spoilers inside threads
function SpoilerText({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      onClick={() => setRevealed(!revealed)}
      className={`cursor-pointer transition-all duration-300 p-2 rounded-xl border ${
        revealed
          ? 'bg-red-500/5 border-red-500/10 text-gray-200'
          : 'bg-zinc-950 border-red-500/25 blur-[3px] select-none text-transparent'
      }`}
      title="Click to reveal movie spoiler comments"
    >
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 mb-1 pointer-events-none">
        <EyeOff className="w-3.5 h-3.5 shrink-0" />
        <span>SPOILER ALERT • CLICK TO REVEAL</span>
      </div>
      <p className="text-xs leading-relaxed pointer-events-none">{text}</p>
    </div>
  );
}
