import {useState, useEffect} from 'react';
import {X, MessageSquare} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Textarea} from './ui/textarea';

interface GitHubIssueFormProps {
  onClose: () => void;
  showForm: boolean;
}

export function GitHubIssueForm({onClose, showForm}: GitHubIssueFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!showForm) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create a GitHub issue by opening a new tab with pre-filled data
      const repoOwner = 'ingeborgsteel';
      const repoName = 'kikk';
      const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}`;
      
      window.open(issueUrl, '_blank');
      
      setMessage('Åpnet GitHub i ny fane! 🎉');
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error opening GitHub issue form:', error);
      setMessage('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div
        className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare size={24}/>
            <h2 className="text-xl font-bold">Forslag til forbedring</h2>
          </div>
          <Button
            variant={"accent"}
            size={"icon"}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24}/>
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-lg space-y-lg">
          <div>
            <label htmlFor="issue-title" className="block text-sm font-semibold mb-2 text-bark dark:text-sand">
              Tittel
            </label>
            <Input
              id="issue-title"
              type="text"
              placeholder="Beskriv forslaget kort..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="issue-description" className="block text-sm font-semibold mb-2 text-bark dark:text-sand">
              Detaljer
            </label>
            <Textarea
              id="issue-description"
              placeholder="Beskriv forslaget i detalj..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>
          {message && (
            <div className={`p-md rounded-md ${message.includes('galt') ? 'bg-rust/20 text-rust-dark' : 'bg-moss/20 text-forest'}`}>
              {message}
            </div>
          )}
          <div className="flex gap-md justify-end pt-md">
            <Button
              type="button"
              onClick={() => {
                onClose();
                setTitle('');
                setDescription('');
                setMessage('');
              }}
              variant="outline"
              size="sm"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
            >
              {loading ? 'Åpner...' : 'Åpne GitHub'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
