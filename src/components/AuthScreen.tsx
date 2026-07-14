import React, { useState } from 'react';
import { Film, LogIn, Mail, Lock, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { syncOrCreateUserProfile } from '../db/storage';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password Recovery State
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Status states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (forgotPasswordMode) {
        if (!forgotEmail) return;
        await sendPasswordResetEmail(auth, forgotEmail);
        setSuccessMessage('Password recovery specifications sent to your email inbox!');
        setTimeout(() => {
          setForgotPasswordMode(false);
          setSuccessMessage(null);
        }, 3500);
        return;
      }

      if (isSignUp) {
        if (!email || !username) {
          setErrorMessage('Email and Username are required.');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          return;
        }
        setSuccessMessage('Creating secure gateway profile...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await syncOrCreateUserProfile(userCredential.user, username, displayName);
        
        setSuccessMessage('Account registered successfully! Logging you in...');
        setTimeout(() => {
          onAuthSuccess(profile);
        }, 1500);
      } else {
        if (!email) {
          setErrorMessage('Please enter email.');
          return;
        }
        setSuccessMessage('Authenticating secure credentials...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await syncOrCreateUserProfile(userCredential.user);
        
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          onAuthSuccess(profile);
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || 'Authentication failed.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Invalid email or password combination.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'This email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'The password is too weak.';
      }
      setErrorMessage(friendlyError);
    }
  };

  // Google Simulated Auth flow
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage('Connecting to Google Secure Gate...');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const profile = await syncOrCreateUserProfile(result.user);
      setSuccessMessage('Logged in with Google successfully!');
      setTimeout(() => {
        onAuthSuccess(profile);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google Authentication popup was blocked or closed. Please try again or log in with Email.');
      } else {
        setErrorMessage('Google authentication restricted by browser environment. Please use Email credentials instead.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-4">
      {/* Cinematic ambient background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80"
          alt="Cinematic Background"
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-zinc-950" />
      </div>

      {/* Subtle Background Bento Glow Effects */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bento-glow-top opacity-60 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bento-glow-bottom opacity-60 blur-[120px] pointer-events-none z-0" />

      {/* Main glass card container */}
      <div className="relative max-w-md w-full bg-[#111111]/80 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-6 animate-fadeIn z-10">
        
        {/* App Branding logo header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#F5C518] text-black mx-auto rounded-2xl flex items-center justify-center shadow-lg shadow-[#F5C518]/15">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-sans font-black tracking-tight text-white font-display uppercase tracking-wider">
            ROV<span className="text-[#F5C518]">IX</span>
          </h2>
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Discover • Track • Share</p>
        </div>

        {/* Dynamic Status Badges */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold text-center animate-shake">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-xl text-[#F5C518] text-xs font-semibold text-center">
            {successMessage}
          </div>
        )}

        {/* Forgot Password Mode */}
        {forgotPasswordMode ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-bold uppercase font-mono block">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="e.g. ssanganiromil@gmail.com"
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-[#F5C518] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5C518] hover:bg-[#F5C518]/85 text-black py-3.5 rounded-xl font-bold transition duration-300 shadow-lg shadow-[#F5C518]/10 text-xs tracking-wider uppercase cursor-pointer"
            >
              Recover Account Credentials
            </button>

            <button
              type="button"
              onClick={() => setForgotPasswordMode(false)}
              className="w-full text-center text-xs text-gray-500 hover:text-white transition cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Conditional Signup Inputs */}
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase font-mono block">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. moviebuff"
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#F5C518] outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase font-mono block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Clara Oswald"
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#F5C518] outline-none transition"
                  />
                </div>
              </>
            )}

            {/* General Inputs */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-bold uppercase font-mono block">
                {isSignUp ? 'Email Address' : 'Email or Username'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isSignUp ? 'e.g. ssanganiromil@gmail.com' : 'e.g. romils or email'}
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-[#F5C518] outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs text-gray-500 font-bold uppercase font-mono block">Password Code</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-[10px] text-[#F5C518] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-[#F5C518] outline-none transition"
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-white/10 bg-zinc-950 text-[#F5C518] focus:ring-0"
              />
              <label htmlFor="remember" className="cursor-pointer select-none text-gray-400 hover:text-white">Remember this gateway session</label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#F5C518] hover:bg-[#F5C518]/90 text-black py-3.5 rounded-xl font-bold transition duration-300 shadow-lg shadow-[#F5C518]/10 text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{isSignUp ? 'Activate Rovix Profile' : 'Authenticate Gateway'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="flex items-center space-x-2 py-2">
              <div className="flex-1 h-[1px] bg-white/5" />
              <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">OR proxy via</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            {/* Google secure button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 bg-zinc-950 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer text-white"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Connect with Google Gateway</span>
            </button>

            {/* Tab Swapper */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-gray-500 hover:text-[#F5C518] transition cursor-pointer"
              >
                {isSignUp ? 'Already registered? Gateway login' : 'New Cinephile? Register Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Floating security disclaimer label */}
      <div className="absolute bottom-4 text-center w-full text-[10px] text-gray-700 font-mono flex items-center justify-center space-x-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>SHA-256 SECURE SHIELD ENCRYPTED PLATFORM</span>
      </div>
    </div>
  );
}
