import React, { useState, useEffect } from 'react';
import { Home, Compass, Search, Bookmark, User, ShieldAlert, Bell } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  userAvatar?: string;
}

export default function BottomNavigation({
  activeTab,
  setActiveTab,
  isAdmin,
  unreadNotifications,
  onOpenNotifications,
  userAvatar
}: BottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    tabs.splice(4, 0, { id: 'admin', label: 'Admin', icon: ShieldAlert });
  }

  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 20) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setVisible(false);
      } else if (lastScrollY - currentScrollY > 8) {
        // Scrolling up significantly
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Desktop Header Sidebar Layout */}
      <header
        id="desktop-header"
        className={`hidden md:flex fixed top-0 left-0 right-0 h-20 bg-[#090909]/80 backdrop-blur-xl border-b border-white/5 z-40 px-8 items-center justify-between transition-all duration-500 transform ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-2xl bg-[#F5C518] flex items-center justify-center font-bold text-black text-2xl tracking-tighter shadow-lg shadow-[#F5C518]/20 group-hover:scale-105 transition-transform duration-300">
            R
          </div>
          <span className="font-sans font-black text-xl tracking-wider text-white flex items-center font-display uppercase">
            ROV<span className="text-[#F5C518]">IX</span>
          </span>
        </div>

        <nav className="flex space-x-1.5 items-center bg-[#111111]/90 p-1.5 rounded-full border border-white/5 shadow-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/15'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-5">
          <button
            id="notif-btn-desktop"
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-white/5 transition-all duration-300 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold font-mono">
                {unreadNotifications}
              </span>
            )}
          </button>
          <div
            id="profile-avatar-shortcut"
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full border border-[#F5C518]/40 cursor-pointer overflow-hidden hover:scale-105 hover:border-[#F5C518] transition-all duration-300 shadow-md shadow-black shrink-0"
          >
            <img
              src={userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-[#090909]/80 backdrop-blur-xl border-b border-white/5 z-40 px-6 flex items-center justify-between transition-all duration-500 transform ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-xl bg-[#F5C518] flex items-center justify-center font-bold text-black text-lg tracking-tighter shadow-lg shadow-[#F5C518]/20">
            R
          </div>
          <span className="font-sans font-black text-lg tracking-wider text-white flex items-center uppercase">
            ROV<span className="text-[#F5C518]">IX</span>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full bg-[#111111]/90 border border-white/5 text-zinc-400 hover:text-white"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold font-mono">
                {unreadNotifications}
              </span>
            )}
          </button>
          <div
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full border border-[#F5C518]/40 overflow-hidden cursor-pointer"
          >
            <img
              src={userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-nav"
        className={`md:hidden fixed bottom-6 left-6 right-6 h-18 bg-[#090909]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] z-40 flex justify-around items-center px-3 shadow-2xl transition-all duration-500 transform ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
        }`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-nav-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-xs cursor-pointer"
            >
              <div className={`p-3 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-[#F5C518] text-black shadow-lg shadow-[#F5C518]/25 scale-105' : 'text-zinc-400 hover:text-white'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );
}
