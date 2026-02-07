import { useState } from 'react';
import { LogIn, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export function AuthButton() {
  const { user, signInWithEmail, signOut } = useAuth();
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await signInWithEmail(email);
    
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the login link!');
      setEmail('');
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowEmailInput(false);
    setMessage('');
  };

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        variant="secondary"
        size="sm"
        className="flex items-center gap-2"
      >
        <LogOut size={16} />
        Logg ut
      </Button>
    );
  }

  if (showEmailInput) {
    return (
      <div className="relative">
        <form onSubmit={handleSignIn} className="flex flex-col gap-2 bg-sand dark:bg-bark p-4 rounded-md shadow-custom absolute right-0 top-full mt-2 min-w-[280px] z-50">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={16} />
            <span className="text-sm font-semibold">Logg inn med e-post</span>
          </div>
          <input
            type="email"
            placeholder="din@epost.no"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-3 py-2 border-2 border-slate-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="flex-1"
            >
              {loading ? 'Sender...' : 'Send lenke'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowEmailInput(false);
                setMessage('');
              }}
              variant="outline"
              size="sm"
            >
              Avbryt
            </Button>
          </div>
          {message && (
            <p className="text-xs mt-1 text-bark dark:text-sand">
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowEmailInput(true)}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogIn size={16} />
      Logg inn
    </Button>
  );
}
