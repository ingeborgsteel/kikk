import {useCallback, useEffect, useMemo, useState} from 'react';
import {X} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';
import {useObservations} from '../context/ObservationsContext';
import {Observation, Species} from '../types/observation';
import {useSpeciesSearch} from "../queries/useSpeciesSearch.ts";
import {TaxonRecord} from "../types/artsdatabanken.ts";
import {Controller, useForm} from "react-hook-form";
import {getRecentSpecies, reverseGeocode} from "../lib/utils.ts";
import {LocationEditor} from "./LocationEditor.tsx";
import {CreateSpecies} from "../api/observations.ts";
import SpeciesItem from "./SpeciesItem.tsx";

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
  const [loadingLocationName, setLoadingLocationName] = useState(false);
  const [geocodingFailed, setGeocodingFailed] = useState(false);
  const [formReady, setFormReady] = useState(!!observation); // Form is ready immediately if editing
  const [currentLocation, setCurrentLocation] = useState(location);

  const {data: searchResults = [], isLoading} = useSpeciesSearch(searchTerm);

  // Get the 5 most recent unique species from all observations
  const recentSpecies = useMemo(() => getRecentSpecies(observations, 5), [observations]);

  const defaultStartDate = new Date().toISOString().slice(0, 16);

  const {control, handleSubmit, setValue, getValues, formState: {isDirty, isValid}} = useForm<Observation>({
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
        <div
          className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center z-[2000]">
          <h2 className="text-xl font-bold">{observation ? "Rediger kikk" : "Opprett kikk"}</h2>
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
          <form onSubmit={handleSubmit(save)}>
            <div className="p-lg space-y-lg overflow-x-hidden">
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
                      onChange={(e) =>
                        onChange(e.target.value === '' ? undefined : Number(e.target.value))
                      }
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
                name={'species'}
                control={control}
                rules={{validate: (value) => value && value.length > 0 || 'Du må legge til minst én art'}}
                render={({field: {value: species = [], onChange}}) => {

                  const addSpecies = (taxon: TaxonRecord) => {
                    const newObservation: CreateSpecies = {
                      species: taxon,
                      gender: "unknown",
                      count: 1,
                    };
                    onChange([newObservation, ...species]);
                    setSearchTerm('');
                    setShowResults(false);
                  };

                  const updateSpecies = (index: number, field: keyof Species, value: string | number) => {
                    const updated = [...species];
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

                  const removeSpecies = (index: number) => {
                    onChange(species.filter((_, i) => i !== index));
                  };

                  return (
                    <>
                      <div>
                        <Label htmlFor="species-search" className="text-bark dark:text-sand">
                          Søk etter art
                        </Label>
                        {recentSpecies.length > 0 && (
                          <div className="mt-2 mb-3">
                            <div className="text-xs text-slate mb-2">Nylig observerte arter:</div>
                            <div className="flex flex-wrap gap-2">
                              {recentSpecies.map((species) => (
                                <button
                                  key={species.Id}
                                  type="button"
                                  onClick={() => addSpecies(species)}
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
                                  onClick={() => addSpecies(species)}
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
                        <Label className="text-bark dark:text-sand">Observerte arter</Label>
                        {species.length === 0 && (
                          <p className="text-sm text-slate mt-1">
                            Ingen arter lagt til enda. Bruk søkefeltet over for å legge til arter du har observert.
                          </p>
                        )}
                        <div className="mt-1 space-y-sm">
                          {species.map((s, index) => (
                            <SpeciesItem
                              key={index}
                              species={s}
                              updateSpecies={(field: keyof Species, value: string | number) => updateSpecies(index, field, value)}
                              removeSpecies={() => removeSpecies(index)}
                            />
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

            </div>
            <div
              className="flex gap-md justify-end pt-md sticky bottom-0 bg-sand dark:bg-bark border-t-2 border-moss p-md z-10">
              <Button type="button" variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button type="submit" disabled={!isDirty || !isValid}>
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
