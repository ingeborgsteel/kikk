import {createContext, ReactNode, useContext, useEffect} from 'react';
import {Observation} from '../types/observation';
import {
  useCreateObservation,
  useDeleteObservation,
  useFetchObservations,
  useUpdateObservation
} from "../queries/useObservation.ts";
import {CreateObservationInput} from "../api/observations.ts";

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: CreateObservationInput) => void;
  updateObservation: (observation: Observation) => void;
  deleteObservation: (id: string) => void;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(undefined);

const STORAGE_KEY = 'kikk_observations';

export function ObservationsProvider({children}: { children: ReactNode }) {
  const {data: observations = []} = useFetchObservations();
  const {mutate: create} = useCreateObservation();
  const {mutate: remove} = useDeleteObservation();
  const {mutate: update} = useUpdateObservation();

  // Save observations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  }, [observations]);

  const addObservation = (observation: CreateObservationInput) => {
    create(observation, {
      onError: (error) => {
        console.error('Failed to create observation:', error);
      }
    });
  };

  const updateObservation = (updatedObservation: Observation) => {
    update(updatedObservation, {
      onError: (error) => {
        console.error('Failed to update observation:', error);
      }
    });
  };

  const deleteObservation = (id: string) => {
    remove(id, {
      onError: (error) => {
        console.error('Failed to delete observation:', error);
      }
    });
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
