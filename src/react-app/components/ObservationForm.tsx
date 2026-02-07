import {useCallback, useState, useMemo} from 'react';
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
import {getRecentSpecies} from "../lib/utils.ts";

interface ObservationFormProps {
  observation?: Observation,
  onClose: () => void,
  location: { lat: number; lng: number }
}

const ObservationForm = ({observation, onClose, location}: ObservationFormProps) => {
  const {addObservation, updateObservation, observations} = useObservations();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpecies, setExpandedSpecies] = useState<Set<number>>(new Set());

  const {data: searchResults = [], isLoading} = useSpeciesSearch(searchTerm);
  
  // Get the 5 most recent unique species from all observations
  const recentSpecies = useMemo(() => getRecentSpecies(observations, 5), [observations]);

  const {control, handleSubmit} = useForm<Observation>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      location,
      uncertaintyRadius: 10,
      ...observation
    }
  })

  const save = useCallback((data: Observation) => {
    if (data.id) {
      updateObservation(data.id, data);
    } else {
      const now = new Date().toISOString();
      const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 11)
        : `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const id = `obs_${now}_${randomPart}`
      addObservation({
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      });
    }
    onClose();
  }, [addObservation, updateObservation, onClose]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center">
          <h2 className="text-xl font-bold">{observation ? "Rediger Observasjon" : "Opprett Observasjon"}</h2>
          <Button
            variant={"accent"}
            size={"icon"}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24}/>
          </Button>
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
                } else if (field === 'comment' || field === 'age' || field === 'method' || field === 'activity') {
                  updated[index] = {...updated[index], [field]: value as string};
                }
                onChange(updated);
              };

              const removeSpeciesObservation = (index: number) => {
                onChange(speciesObservations.filter((_, i) => i !== index));
                setError(null);
                // Remove from expanded set if it was expanded
                setExpandedSpecies(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(index);
                  return newSet;
                });
              };

              const toggleSpeciesExpanded = (index: number) => {
                setExpandedSpecies(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(index)) {
                    newSet.delete(index);
                  } else {
                    newSet.add(index);
                  }
                  return newSet;
                });
              };

              return (
                <>
                  <div>
                    <Label htmlFor="species-search" className="text-bark dark:text-sand">
                      Søk etter Art
                    </Label>
                    
                    {/* Recently Observed Species */}
                    {recentSpecies.length > 0 && (
                      <div className="mt-2 mb-3">
                        <div className="text-xs text-slate mb-2">Nylig observerte arter:</div>
                        <div className="flex flex-wrap gap-2">
                          {recentSpecies.map((species) => (
                            <button
                              key={species.Id}
                              type="button"
                              onClick={() => addSpeciesObservation(species)}
                              className="px-3 py-1.5 bg-moss/10 hover:bg-moss/20 dark:bg-moss/20 dark:hover:bg-moss/30 text-bark dark:text-sand text-sm rounded-md border border-moss/30 dark:border-moss/40 transition-colors flex items-center gap-1.5"
                              title={species.ValidScientificName}
                            >
                              <span className="font-medium">{species.PrefferedPopularname}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                    <div className="mt-1 space-y-sm">
                      {speciesObservations.map((obs, index) => {
                        const isExpanded = expandedSpecies.has(index);
                        return (
                          <div
                            key={index}
                            className="bg-white dark:bg-forest rounded-md border-2 border-moss"
                          >
                            {/* Compact Header - Always Visible */}
                            <div 
                              className="flex items-center justify-between p-sm cursor-pointer hover:bg-sand/50 dark:hover:bg-bark/50 transition-colors"
                              onClick={() => toggleSpeciesExpanded(index)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-bark dark:text-sand truncate">
                                  {obs.species.PrefferedPopularname}
                                </div>
                              </div>
                              <div className="flex items-center gap-sm ml-sm shrink-0">
                                <Button
                                  variant="accent"
                                  size={"icon"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSpeciesObservation(index);
                                  }}
                                  aria-label="Remove species"
                                  className="shrink-0"
                                >
                                  <X size={20}/>
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-md pb-md space-y-sm border-t border-moss/30">
                                <div className="pt-sm">
                                  <div className="text-sm text-slate italic">{obs.species.ValidScientificName}</div>
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

                                <div className="grid grid-cols-3 gap-sm">
                                  <div>
                                    <Label htmlFor={`age-${index}`} className="text-bark dark:text-sand text-xs">
                                      Alder
                                    </Label>
                                    <Input
                                      id={`age-${index}`}
                                      type="text"
                                      placeholder="f.eks. voksen"
                                      value={obs.age || ''}
                                      onChange={(e) => updateSpeciesObservation(index, 'age', e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`method-${index}`} className="text-bark dark:text-sand text-xs">
                                      Metode
                                    </Label>
                                    <Input
                                      id={`method-${index}`}
                                      type="text"
                                      placeholder="f.eks. sett"
                                      value={obs.method || ''}
                                      onChange={(e) => updateSpeciesObservation(index, 'method', e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`activity-${index}`} className="text-bark dark:text-sand text-xs">
                                      Aktivitet
                                    </Label>
                                    <Input
                                      id={`activity-${index}`}
                                      type="text"
                                      placeholder="f.eks. flyr"
                                      value={obs.activity || ''}
                                      onChange={(e) => updateSpeciesObservation(index, 'activity', e.target.value)}
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
                            )}
                          </div>
                        );
                      })}
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
