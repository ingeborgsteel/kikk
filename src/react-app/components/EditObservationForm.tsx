import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { useObservations } from '../context/ObservationsContext';
import { Observation, SpeciesObservation } from '../types/observation';

interface EditObservationFormProps {
  observation: Observation;
  onClose: () => void;
}

function EditObservationForm({ observation, onClose }: EditObservationFormProps) {
  const { updateObservation } = useObservations();
  const [error, setError] = useState<string | null>(null);
  
  const [speciesObservations, setSpeciesObservations] = useState<SpeciesObservation[]>(
    observation.speciesObservations
  );
  const [uncertaintyRadius, setUncertaintyRadius] = useState(observation.uncertaintyRadius.toString());
  const [date, setDate] = useState(observation.date.slice(0, 16));
  const [comment, setComment] = useState(observation.comment);

  const updateSpeciesObservation = (index: number, field: keyof SpeciesObservation, value: string | number) => {
    const updated = [...speciesObservations];
    if (field === 'count') {
      updated[index] = { ...updated[index], [field]: typeof value === 'number' ? value : parseInt(value) || 1 };
    } else if (field === 'gender') {
      updated[index] = { ...updated[index], [field]: value as 'male' | 'female' | 'unknown' };
    }
    setSpeciesObservations(updated);
  };

  const removeSpeciesObservation = (index: number) => {
    if (speciesObservations.length === 1) {
      setError('An observation must have at least one species');
      return;
    }
    setSpeciesObservations(speciesObservations.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedObservation: Observation = {
      ...observation,
      uncertaintyRadius: parseInt(uncertaintyRadius) || 10,
      speciesObservations,
      date,
      comment,
      updatedAt: new Date().toISOString(),
    };

    updateObservation(observation.id, updatedObservation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Observation</h2>
          <button 
            onClick={onClose}
            className="text-sand hover:text-sunlit transition-colors p-1"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-lg space-y-lg">
          {/* Error Message */}
          {error && (
            <div className="bg-rust/10 border-2 border-rust text-rust p-md rounded-md flex items-start gap-sm">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {/* Location Display (read-only) */}
          <div>
            <Label className="text-bark dark:text-sand">Location</Label>
            <p className="text-sm text-slate mt-1">
              Lat: {observation.location.lat.toFixed(4)}, Lng: {observation.location.lng.toFixed(4)}
            </p>
          </div>

          {/* Uncertainty Radius */}
          <div>
            <Label htmlFor="uncertainty" className="text-bark dark:text-sand">
              Uncertainty Radius (meters)
            </Label>
            <Input
              id="uncertainty"
              type="number"
              min="0"
              value={uncertaintyRadius}
              onChange={(e) => setUncertaintyRadius(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-bark dark:text-sand">
              Date and Time
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Species Observations */}
          <div>
            <Label className="text-bark dark:text-sand">Species Observations</Label>
            <div className="mt-1 space-y-md">
              {speciesObservations.map((obs, index) => (
                <div
                  key={index}
                  className="bg-white p-md rounded-md border-2 border-moss space-y-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-bark">{obs.species.vernacularName}</div>
                      <div className="text-sm text-slate italic">{obs.species.scientificName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSpeciesObservation(index)}
                      className="text-rust hover:text-rust-dark transition-colors p-1"
                      aria-label="Remove species"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-sm">
                    <div>
                      <Label htmlFor={`gender-${index}`} className="text-bark text-xs">
                        Gender
                      </Label>
                      <Select
                        id={`gender-${index}`}
                        value={obs.gender}
                        onChange={(e) => updateSpeciesObservation(index, 'gender', e.target.value)}
                        className="mt-1"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`count-${index}`} className="text-bark text-xs">
                        Count
                      </Label>
                      <Input
                        id={`count-${index}`}
                        type="number"
                        min="1"
                        value={obs.count}
                        onChange={(e) => updateSpeciesObservation(index, 'count', parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="text-bark dark:text-sand">
              Comment (optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Add any additional notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-md justify-end pt-md">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Observation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditObservationForm;
