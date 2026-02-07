import {useState} from 'react';
import {MapPin, Pencil, Trash2} from 'lucide-react';
import {useObservations} from '../context/ObservationsContext';
import {Button} from './ui/button';
import ObservationForm from './ObservationForm.tsx';

interface MyObservationsProps {
  onBack: () => void;
}

function MyObservations({onBack}: MyObservationsProps) {
  const {observations, deleteObservation} = useObservations();
  const [editingId, setEditingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne observasjonen?')) {
      deleteObservation(id);
    }
  };

  const editingObservation = observations.find(obs => obs.id === editingId);

  return (
    <div className="w-full min-h-screen bg-sand">
      <header className="bg-forest text-sand p-lg md:p-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">Mine Observasjoner</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        <div className="mb-lg">
          <Button onClick={onBack} variant="outline">
            ← Tilbake til Kart
          </Button>
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
              <div
                key={observation.id}
                className="bg-white rounded-lg shadow-custom p-lg border-2 border-slate-border"
              >
                <div className="flex justify-between items-start mb-md">
                  <div>
                    <div className="flex items-center gap-sm text-sm text-slate mb-xs">
                      <MapPin size={16}/>
                      <span>
                        {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-sm text-slate">
                      {formatDate(observation.date)} • ±{observation.uncertaintyRadius}m
                    </p>
                  </div>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => setEditingId(observation.id)}
                      className="p-sm text-rust dark:text-sand transition-colors"
                      aria-label="Edit observation"
                    >
                      <Pencil size={18}/>
                    </button>
                    <button
                      onClick={() => handleDelete(observation.id)}
                      className="p-sm text-rust dark:text-sand  transition-colors"
                      aria-label="Delete observation"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                <div className="space-y-sm">
                  <h3 className="font-semibold text-bark">Arter Observert:</h3>
                  {observation.speciesObservations.map((speciesObs, idx) => (
                    <div key={idx} className="pl-md border-l-2 border-moss">
                      <div className="font-medium text-bark">{speciesObs.species.PrefferedPopularname}</div>
                      <div className="text-sm text-slate italic">{speciesObs.species.ValidScientificName}</div>
                      <div className="text-sm text-slate">
                        Count: {speciesObs.count} • Gender: {speciesObs.gender}
                      </div>
                      {speciesObs.comment && (
                        <div className="text-sm text-bark mt-1 italic">"{speciesObs.comment}"</div>
                      )}
                    </div>
                  ))}
                </div>

                {observation.comment && (
                  <div className="mt-md pt-md border-t border-slate-border">
                    <p className="text-sm font-medium text-bark mb-1">Generell Observasjon:</p>
                    <p className="text-sm text-bark">{observation.comment}</p>
                  </div>
                )}
              </div>
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
    </div>
  );
}

export default MyObservations;
