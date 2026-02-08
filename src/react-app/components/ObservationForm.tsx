import {useCallback, useEffect, useMemo, useState} from 'react';
import {X} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Select} from './ui/select';
import {Textarea} from './ui/textarea';
import {useObservations} from '../context/ObservationsContext';
import {Observation, SpeciesObservation} from '../types/observation';
import {useSpeciesSearch} from "../queries/useSpeciesSearch.ts";
import {TaxonRecord} from "../types/artsdatabanken.ts";
import {Controller, useForm} from "react-hook-form";
import {getRecentSpecies, reverseGeocode} from "../lib/utils.ts";
import {LocationEditor} from "./LocationEditor.tsx";

interface ObservationFormProps {
  observation?: Observation,
  onClose: () => void,
  location: { lat: number; lng: number },
  zoom?: number
}

const ObservationForm = ({observation, onClose, location, zoom = 13}: ObservationFormProps) => {
  const {addObservation, updateObservation, observations} = useObservations();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpecies, setExpandedSpecies] = useState<Set<number>>(new Set());
  const [loadingLocationName, setLoadingLocationName] = useState(false);
  const [geocodingFailed, setGeocodingFailed] = useState(false);
  const [formReady, setFormReady] = useState(!!observation); // Form is ready immediately if editing
  const [currentLocation, setCurrentLocation] = useState(location);

  const {data: searchResults = [], isLoading} = useSpeciesSearch(searchTerm);

  // Get the 5 most recent unique species from all observations
  const recentSpecies = useMemo(() => getRecentSpecies(observations, 5), [observations]);

  const defaultStartDate = new Date().toISOString().slice(0, 16);

  const {control, handleSubmit, setValue, getValues} = useForm<Observation>({
    defaultValues: {
      startDate: observation?.startDate || defaultStartDate,
      endDate: observation?.endDate || defaultStartDate,
      locationName: observation?.locationName || '',
      location: currentLocation,
      uncertaintyRadius: observation?.uncertaintyRadius || 10,
      ...observation
    }
  })

  // Handle location change from map editor
  const handleLocationChange = useCallback((lat: number, lng: number) => {
    const newLocation = {lat, lng};
    setCurrentLocation(newLocation);
    setValue('location', newLocation);

    // Re-fetch location name when position changes significantly (> 100m)
    const distance = Math.sqrt(
      Math.pow((lat - currentLocation.lat) * 111000, 2) +
      Math.pow((lng - currentLocation.lng) * 111000 * Math.cos(lat * Math.PI / 180), 2)
    );

    if (distance > 100) {
      setLoadingLocationName(true);
      setGeocodingFailed(false);
      reverseGeocode(lat, lng)
        .then(name => {
          if (name) {
            setValue('locationName', name);
            setGeocodingFailed(false);
          } else {
            setGeocodingFailed(true);
          }
        })
        .catch(err => {
          console.error('Failed to get location name:', err);
          setGeocodingFailed(true);
        })
        .finally(() => {
          setLoadingLocationName(false);
        });
    }
  }, [currentLocation, setValue]);

  // Fetch location name when form opens for a new observation
  useEffect(() => {
    const currentLocationName = getValues('locationName');
    // Only fetch if this is a new observation and locationName is not yet set
    if (!observation && currentLocationName === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingLocationName(true);
      setGeocodingFailed(false);
      reverseGeocode(currentLocation.lat, currentLocation.lng)
        .then(name => {
          if (name) {
            setValue('locationName', name);
            setGeocodingFailed(false);
          } else {
            setGeocodingFailed(true);
          }
        })
        .catch(err => {
          console.error('Failed to get location name:', err);
          setGeocodingFailed(true);
        })
        .finally(() => {
          setLoadingLocationName(false);
          setFormReady(true); // Form is ready after geocoding completes (success or failure)
        });
    }
  }, [observation, currentLocation, setValue, getValues]);

  const save = useCallback((data: Observation) => {
    const {startDate, endDate} = data;

    if (data.id) {
      updateObservation({
        ...data,
        startDate,
        endDate,
      });
    } else {
      addObservation({
        ...data,
        startDate,
        endDate,
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

        {!formReady ? (
          <div className="p-xl flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-moss/30 border-t-moss rounded-full animate-spin mb-md"></div>
            <p className="text-bark dark:text-sand text-lg">Henter stedsinformasjon...</p>
          </div>
        ) : (
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
              <p className="text-sm text-slate mt-1 mb-2">
                Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
              </p>
              <LocationEditor
                location={currentLocation}
                onLocationChange={handleLocationChange}
                zoom={zoom}
              />
            </div>

            <Controller
              name={'locationName'}
              control={control}
              render={({field: {value, onChange}}) => (
                <div>
                  <Label htmlFor="locationName" className="text-bark dark:text-sand">
                    Stedsnavn
                  </Label>
                  <div className="relative">
                    <Input
                      id="locationName"
                      type="text"
                      placeholder="F.eks. Oslo, Nordmarka"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="mt-1"
                    />
                    {loadingLocationName && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-4 h-4 border-2 border-slate-border border-t-rust rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate mt-1">
                    {geocodingFailed
                      ? 'Kunne ikke hente stedsnavn automatisk. Vennligst fyll inn manuelt.'
                      : 'Foreslått basert på koordinater, kan redigeres'}
                  </p>
                </div>
              )}
            />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <Controller
                name={'startDate'}
                control={control}
                render={({field: {value, onChange}}) => (
                  <div>
                    <Label htmlFor="startDate" className="text-bark dark:text-sand">
                      Starttid
                    </Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="mt-1 max-w-full"
                    />
                  </div>
                )}
              />

              <Controller
                name={'endDate'}
                control={control}
                render={({field: {value, onChange}}) => (
                  <div>
                    <Label htmlFor="endDate" className="text-bark dark:text-sand">
                      Sluttid
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="mt-1 max-w-full"
                    />
                  </div>
                )}
              />
            </div>

            <Controller
              name={'speciesObservations'}
              control={control}
              render={({field: {value: speciesObservations = [], onChange}}) => {

                const addSpeciesObservation = (species: TaxonRecord) => {
                  const newObservation: Omit<SpeciesObservation, "id"> = {
                    species,
                    gender: "unknown",
                    count: 1,
                  };
                  onChange([...speciesObservations, newObservation]);
                  setSearchTerm('');
                  setShowResults(false);
                  setError(null); // Clear error when species is added
                  // Automatically expand newly added species
                  setExpandedSpecies(prev => {
                    const newSet = new Set(prev);
                    newSet.add(speciesObservations.length); // Add the index of the new item
                    return newSet;
                  });
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
                  // Adjust expanded indices: remove the deleted index and shift down higher indices
                  setExpandedSpecies(prev => {
                    const newSet = new Set<number>();
                    prev.forEach(expandedIndex => {
                      if (expandedIndex < index) {
                        // Keep indices below the removed item
                        newSet.add(expandedIndex);
                      } else if (expandedIndex > index) {
                        // Shift down indices above the removed item
                        newSet.add(expandedIndex - 1);
                      }
                      // Skip the removed index itself
                    });
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
                                <div
                                  className="font-medium text-bark dark:text-sand">{species.PrefferedPopularname}</div>
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
                                    <Label htmlFor={`species-comment-${index}`}
                                           className="text-bark dark:text-sand text-xs">
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
        )}
      </div>
    </div>
  );
}

export default ObservationForm;
