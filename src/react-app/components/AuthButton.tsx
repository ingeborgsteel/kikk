import { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { isSupabaseConfigured } from '../lib/supabase';

export function AuthButton() {
  const { user, signInWithEmail, signOut } = useAuth();
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Focus close button when modal opens
  useEffect(() => {
    if (showEmailInput && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showEmailInput]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      // Map common errors to user-friendly Norwegian messages
      let errorMessage = 'Noe gikk galt. Prøv igjen.';
      if (error.message.toLowerCase().includes('invalid login credentials') || 
          error.message.toLowerCase().includes('invalid email or password')) {
        errorMessage = 'Ugyldig e-post eller passord.';
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        errorMessage = 'E-posten din er ikke bekreftet. Sjekk innboksen din.';
      } else if (error.message.toLowerCase().includes('rate limit')) {
        errorMessage = 'For mange forsøk. Vent litt før du prøver igjen.';
      }
      setMessage(errorMessage);
    } else {
      setEmail('');
      setPassword('');
      setShowEmailInput(false);
    }
    
    setLoading(false);
  };

  const handleCloseModal = () => {
    setShowEmailInput(false);
    setEmail('');
    setPassword('');
    setMessage('');
  };

  const handleSignOut = async () => {
    await signOut();
    handleCloseModal();
  };

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <LogOut size={16} />
        Logg ut
      </Button>
    );
  }

  if (showEmailInput) {
    return (
      <div 
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
        onClick={(e) => {
          // Close modal when clicking on backdrop
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <div 
          className="bg-sand dark:bg-bark w-full max-w-md rounded-lg shadow-custom-2xl border-2 border-moss"
          onKeyDown={(e) => {
            // Close modal when pressing Escape
            if (e.key === 'Escape') {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Mail size={20} />
              <h2 id="login-modal-title" className="text-xl font-bold">Logg inn</h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={handleCloseModal}
              className="text-sand hover:text-sunlit transition-colors p-1"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSignIn} className="p-lg space-y-lg">
            {message && (
              <div className="bg-rust/10 border-2 border-rust text-rust p-md rounded-md text-sm">
                {message}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-bark dark:text-sand mb-1">
                E-post
              </label>
              <input
                id="email"
                type="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-slate-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-moss"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bark dark:text-sand mb-1">
                Passord
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark/50 dark:text-sand/50" />
                <input
                  id="password"
                  type="password"
                  placeholder="Passord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border-2 border-slate-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
            </div>
            
            <div className="flex gap-md justify-end pt-md">
              <Button
                type="button"
                onClick={handleCloseModal}
                variant="outline"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logger inn...' : 'Logg inn'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowEmailInput(true)}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <LogIn size={16} />
      Logg inn
    </Button>
  );
}
