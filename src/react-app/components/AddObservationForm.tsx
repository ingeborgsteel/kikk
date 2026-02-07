import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { useSpeciesSearch } from '../hooks/useSpeciesSearch';
import { Species, SpeciesObservation } from '../types/observation';

interface AddObservationFormProps {
  location: { lat: number; lng: number };
  onSave: (observation: {
    location: { lat: number; lng: number };
    uncertaintyRadius: number;
    speciesObservations: SpeciesObservation[];
    date: string;
    comment: string;
  }) => void;
  onCancel: () => void;
}

function AddObservationForm({ location, onSave, onCancel }: AddObservationFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { results: searchResults, isSearching } = useSpeciesSearch(searchTerm);
  
  const [speciesObservations, setSpeciesObservations] = useState<SpeciesObservation[]>([]);
  const [currentGender, setCurrentGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [currentCount, setCurrentCount] = useState('1');
  const [currentSpeciesComment, setCurrentSpeciesComment] = useState('');
  
  const [uncertaintyRadius, setUncertaintyRadius] = useState('10');
  const [comment, setComment] = useState('');
  
  // Set date to beginning of current hour
  const getDefaultDate = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  };
  const [date, setDate] = useState(getDefaultDate());

  const addSpeciesObservation = (species: Species) => {
    const count = parseInt(currentCount) || 1;
    const newObservation: SpeciesObservation = {
      species,
      gender: currentGender,
      count,
      comment: currentSpeciesComment,
    };
    
    setSpeciesObservations([...speciesObservations, newObservation]);
    setSearchTerm('');
    setShowResults(false);
    setCurrentCount('1');
    setCurrentGender('unknown');
    setCurrentSpeciesComment('');
    setError(null); // Clear error when species is added
  };

  const removeSpeciesObservation = (index: number) => {
    setSpeciesObservations(speciesObservations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (speciesObservations.length === 0) {
      setError('Please add at least one species observation');
      return;
    }

    onSave({
      location,
      uncertaintyRadius: parseInt(uncertaintyRadius) || 10,
      speciesObservations,
      date,
      comment,
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Observation</h2>
          <button 
            onClick={onCancel}
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
          
          {/* Location Display */}
          <div>
            <Label className="text-bark dark:text-sand">Location</Label>
            <p className="text-sm text-slate mt-1">
              Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
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

          {/* Species Search */}
          <div>
            <Label htmlFor="species-search" className="text-bark dark:text-sand">
              Search for Species
            </Label>
            <div className="relative mt-1">
              <Input
                id="species-search"
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length >= 2) {
                    setShowResults(true);
                  } else {
                    setShowResults(false);
                  }
                }}
                onFocus={() => searchTerm.length >= 2 && searchResults.length > 0 && setShowResults(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-slate-border border-t-rust rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-bark border-2 border-slate-border dark:border-slate rounded-md shadow-custom-lg max-h-60 overflow-y-auto">
                  {searchResults.map((species) => (
                    <button
                      key={species.id}
                      type="button"
                      onClick={() => addSpeciesObservation(species)}
                      className="w-full text-left px-3 py-2 hover:bg-sand dark:hover:bg-forest transition-colors border-b border-slate-border dark:border-slate last:border-b-0"
                    >
                      <div className="font-medium text-bark dark:text-sand">{species.vernacularName}</div>
                      <div className="text-sm text-slate italic">{species.scientificName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gender and Count (shown before adding species) */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <Label htmlFor="gender" className="text-bark dark:text-sand">
                Gender
              </Label>
              <Select
                id="gender"
                value={currentGender}
                onChange={(e) => setCurrentGender(e.target.value as 'male' | 'female' | 'unknown')}
                className="mt-1"
              >
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="count" className="text-bark dark:text-sand">
                Count
              </Label>
              <Input
                id="count"
                type="number"
                min="1"
                value={currentCount}
                onChange={(e) => setCurrentCount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Per-species Comment (shown before adding species) */}
          <div>
            <Label htmlFor="species-comment" className="text-bark dark:text-sand">
              Species Comment (optional)
            </Label>
            <Textarea
              id="species-comment"
              placeholder="Notes about this specific species..."
              value={currentSpeciesComment}
              onChange={(e) => setCurrentSpeciesComment(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Added Species List */}
          {speciesObservations.length > 0 && (
            <div>
              <Label className="text-bark dark:text-sand">Added Species</Label>
              <div className="mt-1 space-y-sm">
                {speciesObservations.map((obs, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-forest p-sm rounded-md border-2 border-moss"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-bark dark:text-sand">{obs.species.vernacularName}</div>
                        <div className="text-sm text-slate">
                          {obs.count} {obs.count === 1 ? 'individual' : 'individuals'} • {obs.gender}
                        </div>
                        {obs.comment && (
                          <div className="text-sm text-bark dark:text-sand mt-1 italic">"{obs.comment}"</div>
                        )}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Observation Comment */}
          <div>
            <Label htmlFor="comment" className="text-bark dark:text-sand">
              Overall Observation Comment (optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Add notes about the overall observation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-md justify-end pt-md">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Observation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddObservationForm;
