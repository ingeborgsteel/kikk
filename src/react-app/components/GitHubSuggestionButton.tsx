import {MessageSquare} from 'lucide-react';
import {Button} from './ui/button';

interface GitHubSuggestionButtonProps {
  onClick: () => void;
}

export function GitHubSuggestionButton({onClick}: GitHubSuggestionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-20 md:bottom-6 right-6 z-[1000] shadow-custom-xl hover:shadow-custom-2xl transition-all"
      aria-label="Suggest improvements"
      title="Forslag til forbedring"
    >
      <MessageSquare size={20}/>
    </Button>
  );
}
