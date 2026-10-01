'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from './AuthContext';
import { useSearchParams } from 'next/navigation';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
};

// 1. Inner component where useSearchParams is executed
const AuthModalContent = ({ isOpen, onClose, onOpen }: AuthModalProps) => {
  const { login } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  
  // Input form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // UI Status Alerts View States
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

  // Trigger Modal Open from Query Params (e.g. ?auth=login or ?auth=register)
  useEffect(() => {
    const authAction = searchParams.get('auth');
    if (authAction === 'login' || authAction === 'register') {
      if (authAction === 'register') setView('register');
      if (authAction === 'login') setView('login');
      if (onOpen) onOpen();
    }
  }, [searchParams, onOpen]);

  // Sweeps states clean on visibility toggle
  useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setAlertMessage('');
    setShowVerifyAlert(false);
    setShowResetAlert(false);
    setView('login');
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to process redirect handoff
  const handleSuccessRedirect = () => {
    onClose();
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (view === 'login') {
        await login(email, password);
        handleSuccessRedirect();
      } else if (view === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed.');

        if (data.status === 'UNVERIFIED_RESENT' || data.status === 'NEW_REGISTRATION') {
          setAlertMessage(data.message);
          setShowVerifyAlert(true);
        }
      } else if (view === 'forgot-password') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');

        setAlertMessage(data.message || 'Check your email for a reset link.');
        setShowResetAlert(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        
        {/* Close Button Trigger */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition text-lg"
        >
          ✕
        </button>

        {/* ✉️ Conditional View A: Renders Verification Success Alert Pane */}
        {showVerifyAlert ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold animate-pulse">
              ✉️
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Verify your email</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {alertMessage}
            </p>
            <button
              onClick={handleSuccessRedirect}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Close Window
            </button>
          </div>
        ) : showResetAlert ? (
          /* 🔄 Conditional View B: Renders Password Reset Success Alert Pane */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Reset Email Sent</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {alertMessage}
            </p>
            <button
              onClick={() => {
                setShowResetAlert(false);
                setView('login');
              }}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Back to Log in
            </button>
          </div>
        ) : (
          /* 🔑 Main Forms Layout Router (Login, Register, and Forgot Password views) */
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {view === 'login' && 'Log in'}
                {view === 'register' && 'Create account'}
                {view === 'forgot-password' && 'Reset Password'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-black"
                  required
                />
              </div>

              {view !== 'forgot-password' && (
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setView('forgot-password');
                        }}
                        className="text-xs text-gray-500 hover:text-black hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-black"
                    required
                    minLength={6}
                  />
                </div>
              )}

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? 'Processing…' : view === 'login' ? 'Log in' : view === 'register' ? 'Register' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
              {view === 'forgot-password' ? (
                <button
                  onClick={() => {
                    setError('');
                    setView('login');
                  }}
                  className="text-black font-semibold hover:underline block mx-auto"
                >
                  Back to Log in
                </button>
              ) : (
                <p>
                  {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setError('');
                      setView(view === 'login' ? 'register' : 'login');
                    }}
                    className="text-black font-semibold hover:underline"
                  >
                    {view === 'login' ? 'Register' : 'Log in'}
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 2. Export wrapped in Suspense so Next.js static prerendering succeeds
export const AuthModal = (props: AuthModalProps) => {
  return (
    <Suspense fallback={null}>
      <AuthModalContent {...props} />
    </Suspense>
  );
};