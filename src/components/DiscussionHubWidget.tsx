import React, { useState } from 'react';
import { 
  MessageSquare, EyeOff, ThumbsUp, Plus, CheckCircle2, HelpCircle, 
  Sparkles, Award, Quote as QuoteIcon, MessageCircle 
} from 'lucide-react';
import { 
  getFanzoneThreads, getFanzoneTheories, getFanzonePolls, getFanzoneQuotes,
  addFanzoneThread, addFanzoneTheory, voteFanzoneTheory,
  addFanzoneQuote, voteFanzoneQuote, voteFanzonePoll, awardXP
} from '../db/storage';

interface DiscussionHubWidgetProps {
  movieId: string;
  userId: string;
  username: string;
}

export default function DiscussionHubWidget({ movieId, userId, username }: DiscussionHubWidgetProps) {
  const [activeSubTab, setActiveSubTab] = useState<'threads' | 'theories' | 'polls' | 'quotes'>('threads');

  // Input states
  const [newComment, setNewComment] = useState('');
  const [newCommentSpoiler, setNewCommentSpoiler] = useState(false);
  const [newTheory, setNewTheory] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newQuoteChar, setNewQuoteChar] = useState('');

  // Experience Notification Toast
  const [xpToast, setXpToast] = useState<string | null>(null);

  const showXpToast = (message: string) => {
    setXpToast(message);
    setTimeout(() => setXpToast(null), 3000);
  };

  // Get real-time lists from Firestore memory cache
  const threads = getFanzoneThreads(movieId);
  const theories = getFanzoneTheories(movieId);
  const polls = getFanzonePolls(movieId);
  const quotes = getFanzoneQuotes(movieId);

  // Actions
  const handleVote = async (pollId: string, optionIdx: number) => {
    await voteFanzonePoll(pollId, optionIdx, userId);
    showXpToast('+10 XP Earned! Polling Choice Synchronized! 📊');
  };

  const handleLikeTheory = async (theoryId: string) => {
    await voteFanzoneTheory(theoryId, userId);
    showXpToast('+5 XP Earned! Theory Upvoted! 🧠');
  };

  const handleVoteQuote = async (quoteId: string) => {
    await voteFanzoneQuote(quoteId, userId);
    showXpToast('+5 XP Earned! Film Quote Upvoted! 💬');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addFanzoneThread(movieId, username, newComment, newCommentSpoiler);
    setNewComment('');
    setNewCommentSpoiler(false);
    showXpToast('+15 XP Earned! Lore thread comment added! 🌟');
  };

  const handleAddTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheory.trim()) return;

    await addFanzoneTheory(movieId, username, newTheory, userId);
    setNewTheory('');
    showXpToast('+20 XP Earned! Creative theory shared! 🧠');
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim() || !newQuoteChar.trim()) return;

    await addFanzoneQuote(movieId, newQuote, newQuoteChar, userId);
    setNewQuote('');
    setNewQuoteChar('');
    showXpToast('+15 XP Earned! Dialogue Quote Logged! 🎬');
  };

  return (
    <div className="bg-[#111111]/90 border border-white/5 rounded-[2.5rem] p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* XP Toast Notification */}
      {xpToast && (
        <div className="fixed top-24 right-6 bg-[#F5C518] text-black px-5 py-3 rounded-2xl font-black shadow-2xl z-50 animate-bounce flex items-center space-x-2 border border-white/10 text-xs">
          <span>{xpToast}</span>
        </div>
      )}

      {/* Tab select bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-3">
        <div>
          <h3 className="font-sans font-black text-lg text-white flex items-center gap-2">
            <MessageSquare className="w-5.5 h-5.5 text-[#F5C518]" />
            <span>FANZONE SPECTATOR HUB</span>
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider mt-0.5">Explore fan theories, dialogue quotes, and active polls.</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1.5 rounded-full border border-white/5">
          {(['threads', 'theories', 'polls', 'quotes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold capitalize transition cursor-pointer ${
                activeSubTab === tab ? 'bg-[#F5C518] text-black' : 'text-gray-400 hover:text-white'
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
          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {threads.length === 0 ? (
              <p className="text-center py-8 text-zinc-600 text-[10px] uppercase font-mono font-bold">
                No active lore thread. Be the first to start the chat!
              </p>
            ) : (
              threads.map(msg => (
                <div key={msg.id} className="bg-zinc-950 border border-white/5 p-4 rounded-2.5xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#F5C518]">@{msg.author}</span>
                    <span className="text-gray-500 font-mono text-[9px]">{msg.timestamp || 'Just now'}</span>
                  </div>
                  {msg.isSpoiler ? (
                    <SpoilerText text={msg.body} />
                  ) : (
                    <p className="text-gray-200 text-xs leading-relaxed font-sans font-medium">{msg.body}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="space-y-3 pt-2">
            <textarea
              required
              rows={2}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Post a lore reaction, comment, or trivia point..."
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#F5C518] outline-none resize-none font-medium"
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setNewCommentSpoiler(!newCommentSpoiler)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold border transition cursor-pointer ${
                  newCommentSpoiler ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mark as Spoiler</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black rounded-xl text-xs flex items-center gap-1 transition shadow-lg shadow-[#F5C518]/10 cursor-pointer"
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
          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {theories.length === 0 ? (
              <p className="text-center py-8 text-zinc-600 text-[10px] uppercase font-mono font-bold">
                No theories posted yet. Post your symbolic interpretation!
              </p>
            ) : (
              theories.map(th => (
                <div key={th.id} className="bg-zinc-950 border border-white/5 p-4 rounded-2.5xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5C518]" /> Theory by @{th.author}
                    </span>
                    <button
                      onClick={() => handleLikeTheory(th.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-[9px] font-bold transition uppercase cursor-pointer ${
                        th.likedBy?.includes(userId) 
                          ? 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]' 
                          : 'bg-zinc-900 border-white/5 text-gray-500 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{th.likes || 0} Upvotes</span>
                    </button>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed font-sans font-medium">{th.body}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddTheory} className="space-y-3">
            <input
              type="text"
              required
              value={newTheory}
              onChange={e => setNewTheory(e.target.value)}
              placeholder="Describe a compelling plot theory, symbolism, or sequel predictions..."
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#F5C518] outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-lg cursor-pointer uppercase tracking-widest"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share Fan Theory</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. POLLS */}
      {activeSubTab === 'polls' && (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {polls.map(p => {
            const totalVotes = p.options.reduce((acc: number, curr: any) => acc + curr.votes, 0) || 1;
            const hasVoted = p.userVotedIdxMap && p.userVotedIdxMap[userId] !== undefined;
            const userVotedIdx = p.userVotedIdxMap ? p.userVotedIdxMap[userId] : undefined;

            return (
              <div key={p.id} className="bg-zinc-950 border border-white/5 p-4 rounded-2.5xl space-y-3">
                <h4 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                  <HelpCircle className="w-4.5 h-4.5 text-[#F5C518] shrink-0" />
                  {p.question}
                </h4>
                <div className="space-y-2">
                  {p.options.map((opt: any, oIdx: number) => {
                    const percentage = Math.round((opt.votes / totalVotes) * 100);
                    const isSelected = userVotedIdx === oIdx;

                    return (
                      <button
                        key={oIdx}
                        disabled={hasVoted}
                        onClick={() => handleVote(p.id, oIdx)}
                        className={`w-full relative overflow-hidden p-3.5 rounded-xl border text-left flex justify-between items-center text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#F5C518] bg-[#F5C518]/10 text-[#F5C518]'
                            : 'border-white/5 bg-zinc-900/40 text-gray-300 hover:border-white/10'
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
          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {quotes.length === 0 ? (
              <p className="text-center py-8 text-zinc-600 text-[10px] uppercase font-mono font-bold">
                No memorable dialogue quotes logged. Add yours speaker!
              </p>
            ) : (
              quotes.map(q => (
                <div key={q.id} className="bg-zinc-950 border border-white/5 p-4 rounded-2.5xl flex justify-between items-center gap-4 hover:border-white/10 transition">
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-gray-200 italic font-serif text-xs md:text-sm leading-relaxed break-words">"{q.quote}"</p>
                    <p className="text-[9px] text-gray-500 uppercase font-mono font-bold tracking-widest">— {q.character}</p>
                  </div>
                  <button
                    onClick={() => handleVoteQuote(q.id)}
                    className={`px-3 py-2 border rounded-xl flex flex-col items-center justify-center min-w-[55px] transition font-mono text-[9px] uppercase font-black shrink-0 cursor-pointer ${
                      q.votedBy?.includes(userId)
                        ? 'bg-[#F5C518] text-black border-[#F5C518] font-black shadow-md'
                        : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mb-1" />
                    <span>{q.votes || 0}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddQuote} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newQuote}
                onChange={e => setNewQuote(e.target.value)}
                placeholder="Log memorable dialogue quote (e.g. No Time For Caution...)"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={newQuoteChar}
                onChange={e => setNewQuoteChar(e.target.value)}
                placeholder="Speaker (character)"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-3 py-2.5 bg-[#F5C518] hover:bg-[#F5C518]/90 text-black font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-lg cursor-pointer uppercase tracking-widest"
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
      className={`cursor-pointer transition-all duration-300 p-3 rounded-xl border ${
        revealed
          ? 'bg-red-500/5 border-red-500/10 text-gray-200'
          : 'bg-zinc-950 border-red-500/25 blur-[2.5px] select-none text-transparent h-12 flex items-center justify-center'
      }`}
      title="Click to reveal movie spoiler comments"
    >
      {!revealed ? (
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-red-400 pointer-events-none uppercase tracking-wider">
          <EyeOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span>SPOILER ALERT • TAP TO DECRYPT</span>
        </div>
      ) : (
        <p className="text-xs leading-relaxed pointer-events-none font-sans font-semibold">{text}</p>
      )}
    </div>
  );
}
