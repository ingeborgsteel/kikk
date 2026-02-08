import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react';
import {Observation} from '../types/observation';
import {
  useCreateObservation,
  useDeleteObservation,
  useFetchObservations,
  useUpdateObservation
} from "../queries/useObservation.ts";
import {CreateObservationInput} from "../api/observations.ts";
import {isSupabaseConfigured} from "../lib/supabase.ts";

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: CreateObservationInput) => void;
  updateObservation: (observation: Observation) => void;
  deleteObservation: (id: string) => void;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(undefined);

const STORAGE_KEY = 'kikk_observations';

export function ObservationsProvider({children}: { children: ReactNode }) {
  // Memoize Supabase configuration check to avoid re-evaluation on every render
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);
  
  // Local state for when Supabase is not configured
  const [localObservations, setLocalObservations] = useState<Observation[]>(() => {
    if (supabaseConfigured) return [];
    // Load observations from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Supabase hooks (disabled when not configured to avoid unnecessary network requests)
  const {data: supabaseObservations = []} = useFetchObservations({
    enabled: supabaseConfigured,
  });
  const {mutateAsync: create} = useCreateObservation();
  const {mutateAsync: remove} = useDeleteObservation();
  const {mutateAsync: update} = useUpdateObservation();

  // Select the appropriate observations source
  const observations = supabaseConfigured ? supabaseObservations : localObservations;

  // Save observations to localStorage whenever they change (for both modes)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  }, [observations]);

  const addObservation = (observation: CreateObservationInput) => {
    if (supabaseConfigured) {
      create(observation);
    } else {
      // Local mode: add with generated ID and timestamps
      const newObservation: Observation = {
        ...observation,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalObservations(prev => [...prev, newObservation]);
    }
  };

  const updateObservation = (updatedObservation: Observation) => {
    if (supabaseConfigured) {
      update(updatedObservation);
    } else {
      // Local mode: update in state
      setLocalObservations(prev =>
        prev.map(obs => obs.id === updatedObservation.id ? {
          ...updatedObservation,
          updatedAt: new Date().toISOString(),
        } : obs)
      );
    }
  };

  const deleteObservation = (id: string) => {
    if (supabaseConfigured) {
      remove(id);
    } else {
      // Local mode: filter out from state
      setLocalObservations(prev => prev.filter(obs => obs.id !== id));
    }
  };

  return (
    <ObservationsContext.Provider value={{observations, addObservation, updateObservation, deleteObservation}}>
      {children}
    </ObservationsContext.Provider>
  );
}

export function useObservations() {
  const context = useContext(ObservationsContext);
  if (context === undefined) {
    throw new Error('useObservations must be used within an ObservationsProvider');
  }
  return context;
}
