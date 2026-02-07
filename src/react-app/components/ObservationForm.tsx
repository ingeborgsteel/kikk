import {useState} from 'react';
import {X} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Select} from './ui/select';
import {Textarea} from './ui/textarea';
import {useObservations} from '../context/ObservationsContext';
import {Observation, SpeciesObservation} from '../types/observation';
import {useSpeciesSearch} from "../hooks/useSpeciesSearch.ts";
import {TaxonRecord} from "../types/artsdatabanken.ts";
import {Controller, useForm} from "react-hook-form";

interface ObservationFormProps {
  observation?: Observation,
  onClose: () => void,
  location: { lat: number; lng: number }
}

const ObservationForm = ({observation, onClose, location}: ObservationFormProps) => {
  const {addObservation, updateObservation} = useObservations();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {data: searchResults = [], isLoading} = useSpeciesSearch(searchTerm);

  const {control, handleSubmit} = useForm<Observation>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      location,
      uncertaintyRadius: 10,
      ...observation
    }
  })

  const save = (data: Observation) => {
    if (data.id) {
      updateObservation(data.id, data);
    } else {
      const now = new Date().toISOString();
      const random = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const id = `obs_${now}_${random.toString().slice(0, 11)}`
      addObservation({
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
          <h2 className="text-xl font-bold">{observation ? "Rediger Observasjon" : "Opprett Observasjon"}</h2>
          <button
            onClick={onClose}
            className="text-sand hover:text-sunlit transition-colors p-1"
            aria-label="Close"
          >
            <X size={24}/>
          </button>
        </div>

        <form onSubmit={handleSubmit(save)} className="p-lg space-y-lg overflow-x-hidden">
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
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label className="text-bark dark:text-sand">Plassering</Label>
            <p className="text-sm text-slate mt-1">
              Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
            </p>
          </div>

          <Controller
            name={'uncertaintyRadius'}
            control={control}
            render={({field: {value, onChange}}) => (
              <div>
                <Label htmlFor="uncertainty" className="text-bark dark:text-sand">
                  Usikkerhetsradius (meter)
                </Label>
                <Input
                  id="uncertainty"
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          />

          <Controller
            name={'date'}
            control={control}
            render={({field: {value, onChange}}) => (
              <div>
                <Label htmlFor="date" className="text-bark dark:text-sand">
                  Dato og Tid
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="mt-1 max-w-full"
                />
              </div>
            )}
          />

          <Controller
            name={'speciesObservations'}
            control={control}
            render={({field: {value: speciesObservations = [], onChange}}) => {

              const addSpeciesObservation = (species: TaxonRecord) => {
                const newObservation: SpeciesObservation = {
                  species,
                  gender: "unknown",
                  count: 1,
                };
                onChange([...speciesObservations, newObservation]);
                setSearchTerm('');
                setShowResults(false);
                setError(null); // Clear error when species is added
              };

              const updateSpeciesObservation = (index: number, field: keyof SpeciesObservation, value: string | number) => {
                const updated = [...speciesObservations];
                if (field === 'count') {
                  updated[index] = {
                    ...updated[index],
                    [field]: typeof value === 'number' ? value : parseInt(value) || 1
                  };
                } else if (field === 'gender') {
                  updated[index] = {...updated[index], [field]: value as 'male' | 'female' | 'unknown'};
                } else if (field === 'comment') {
                  updated[index] = {...updated[index], [field]: value as string};
                }
                onChange(updated);
              };

              const removeSpeciesObservation = (index: number) => {
                onChange(speciesObservations.filter((_, i) => i !== index));
                setError(null);
              };

              return (
                <>
                  <div>
                    <Label htmlFor="species-search" className="text-bark dark:text-sand">
                      Søk etter Art
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="species-search"
                        type="text"
                        placeholder="Skriv for å søke..."
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
                      {isLoading && (
                        <div className="absolute right-3 top-3">
                          <div
                            className="w-4 h-4 border-2 border-slate-border border-t-rust rounded-full animate-spin"></div>
                        </div>
                      )}

                      {/* Search Results Dropdown */}
                      {showResults && searchResults.length > 0 && (
                        <div
                          className="absolute z-10 w-full mt-1 bg-white dark:bg-bark border-2 border-slate-border dark:border-slate rounded-md shadow-custom-lg max-h-60 overflow-y-auto">
                          {searchResults.map((species) => (
                            <button
                              key={species.Id}
                              type="button"
                              onClick={() => addSpeciesObservation(species)}
                              className="w-full text-left px-3 py-2 hover:bg-sand dark:hover:bg-forest transition-colors border-b border-slate-border dark:border-slate last:border-b-0"
                            >
                              <div className="font-medium text-bark dark:text-sand">{species.PrefferedPopularname}</div>
                              <div className="text-sm text-slate italic">{species.ValidScientificName}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-bark dark:text-sand">Artsobservasjoner</Label>
                    <div className="mt-1 space-y-md">
                      {speciesObservations.map((obs, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-forest p-md rounded-md border-2 border-moss space-y-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div
                                className="font-medium text-bark dark:text-sand">{obs.species.PrefferedPopularname}</div>
                              <div className="text-sm text-slate italic">{obs.species.ValidScientificName}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSpeciesObservation(index)}
                              className="text-rust  dark:text-sand transition-colors p-1"
                              aria-label="Remove species"
                            >
                              <X size={20}/>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-sm">
                            <div>
                              <Label htmlFor={`gender-${index}`} className="text-bark dark:text-sand text-xs">
                                Kjønn
                              </Label>
                              <Select
                                id={`gender-${index}`}
                                value={obs.gender}
                                onChange={(e) => updateSpeciesObservation(index, 'gender', e.target.value)}
                                className="mt-1"
                              >
                                <option value="unknown">Ukjent</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`count-${index}`} className="text-bark dark:text-sand text-xs">
                                Antall
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

                          <div>
                            <Label htmlFor={`species-comment-${index}`} className="text-bark dark:text-sand text-xs">
                              Notat
                            </Label>
                            <Textarea
                              id={`species-comment-${index}`}
                              placeholder="Notater om denne spesifikke arten..."
                              value={obs.comment}
                              onChange={(e) => updateSpeciesObservation(index, 'comment', e.target.value)}
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            }}
          />

          <Controller
            name={'comment'}
            control={control}
            render={({field: {value, onChange}}) => (
              <div>
                <Label htmlFor="comment" className="text-bark dark:text-sand">
                  Kommentar
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Legg til notater om den generelle observasjonen..."
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
          />

          <div className="flex gap-md justify-end pt-md">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit">
              Lagre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ObservationForm;
