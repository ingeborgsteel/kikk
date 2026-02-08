import {useState} from 'react';
import {FileSpreadsheet} from 'lucide-react';
import {useObservations} from '../context/ObservationsContext';
import {Button} from './ui/button';
import ObservationForm from './ObservationForm.tsx';
import {ThemeToggle} from './ThemeToggle';
import {AuthButton} from './AuthButton';
import ExportDialog from './ExportDialog';
import ObservationItem from './ObservationItem';
import {getUnexportedCount} from '../queries/useExports';

interface MyObservationsProps {
  onBack: () => void;
  setShowLoginForm: (show: boolean) => void;
}

function MyObservations({onBack, setShowLoginForm}: MyObservationsProps) {
  const {observations, deleteObservation} = useObservations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const unexportedCount = getUnexportedCount(observations);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    // Use new fields if available, otherwise fall back to old date field
    const start = startDate;
    const end = endDate;

    if (!start) return 'Ukjent dato';

    // If start and end are the same or end is not set, show single date
    if (!end || start === end) {
      return formatDate(start);
    }

    // Show date range
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);

    // If same day, just show time range
    if (startDateTime.toDateString() === endDateTime.toDateString()) {
      return `${formatDate(start)} - ${endDateTime.toLocaleString('no-NO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }

    // Different days, show full range
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne observasjonen?')) {
      deleteObservation(id);
    }
  };

  const editingObservation = observations.find(obs => obs.id === editingId);

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <header className="bg-forest text-sand p-lg md:p-xl relative">
        <div className="max-w-4xl mx-auto ml-16">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">kikket på</h1>
        </div>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle/>
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 md:hidden flex items-center gap-2">
          <AuthButton setShowLoginForm={setShowLoginForm}/>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        <div className="mb-lg flex justify-between items-center gap-md">
          <div className="hidden md:block">
            <Button onClick={onBack} variant="outline">
              ← Tilbake til kart
            </Button>
          </div>
          {observations.length > 0 && (
            <Button onClick={() => setShowExportDialog(true)} className="ml-auto">
              <FileSpreadsheet size={20} className="mr-2" />
              Eksporter til Excel
              {unexportedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-moss text-white text-xs rounded-full">
                  {unexportedCount} nye
                </span>
              )}
            </Button>
          )}
        </div>

        {observations.length === 0 ? (
          <div className="text-center py-xxl">
            <MapPin size={48} className="mx-auto text-slate mb-md"/>
            <p className="text-lg text-slate">Ingen observasjoner ennå</p>
            <p className="text-sm text-slate mt-sm">Klikk på kartet for å legge til din første observasjon!</p>
          </div>
        ) : (
          <div className="space-y-md">
            {observations.map((observation) => (
              <ObservationItem
                key={observation.id}
                observation={observation}
                onEdit={setEditingId}
                onDelete={handleDelete}
                formatDate={formatDate}
                formatDateRange={formatDateRange}
              />
            ))}
          </div>
        )}
      </div>

      {editingId && editingObservation && (
        <ObservationForm
          location={editingObservation.location}
          observation={editingObservation}
          onClose={() => setEditingId(null)}
        />
      )}
      
      {showExportDialog && (
        <ExportDialog
          observations={observations}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}

export default MyObservations;
