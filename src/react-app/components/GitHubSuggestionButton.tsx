import { MessageSquare } from "lucide-react";
import { Button } from "./ui/button";

interface GitHubSuggestionButtonProps {
  onClick: () => void;
  className?: string;
  floating?: boolean;
}

export function GitHubSuggestionButton({
  onClick,
  className,
  floating = true,
}: GitHubSuggestionButtonProps) {
  return (
    <div className="relative group">
      <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-sand/95 dark:bg-bark/95 px-3 py-1.5 text-sm font-medium text-bark dark:text-sand shadow-custom-lg border border-moss/30 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
        Forslag
      </span>
      <Button
        onClick={onClick}
        size="icon"
        className={`${floating ? "fixed bottom-20 md:bottom-6 right-6 z-[500]" : ""} h-10 w-10 box-border shadow-custom-xl hover:shadow-custom-2xl hover:translate-y-0 active:translate-y-0 transition-all ${className ?? ""}`.trim()}
        aria-label="Forslag til forbedring"
        title="Forslag til forbedring"
      >
        <MessageSquare size={20} />
      </Button>
    </div>
  );
}
