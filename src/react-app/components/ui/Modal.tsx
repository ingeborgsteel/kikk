import {useEffect, ReactNode} from 'react';
import {X} from 'lucide-react';
import {Button} from './button';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Optional max width (e.g., 'max-w-2xl', 'max-w-4xl') */
  maxWidth?: string;
  /** Optional callback when Enter is pressed (for forms) */
  onSubmit?: () => void;
  /** Optional icon to display next to title */
  icon?: ReactNode;
}

/**
 * Unified Modal component for all dialogs and forms.
 * 
 * Features:
 * - Consistent header style with X button and title
 * - Close on ESC key
 * - Close on click outside
 * - Optional submit on Enter key
 * - Configurable width
 * 
 * Usage:
 * ```tsx
 * <Modal
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   title="My Dialog"
 *   maxWidth="max-w-2xl"
 * >
 *   <div>Dialog content here</div>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  onSubmit,
  icon
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ESC
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Submit on Enter (if onSubmit is provided)
      if (e.key === 'Enter' && onSubmit && !e.shiftKey) {
        // Don't submit if inside a textarea (allow line breaks)
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSubmit]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className={`w-full ${maxWidth} bg-sand dark:bg-bark rounded-lg shadow-custom-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header with consistent styling */}
        <div className="sticky top-0 bg-forest text-sand p-lg flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold flex items-center gap-sm">
            {icon}
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sand hover:bg-moss"
            aria-label="Close"
          >
            <X size={24}/>
          </Button>
        </div>

        {/* Content */}
        <div className="p-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
