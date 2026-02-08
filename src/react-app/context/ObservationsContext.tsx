import {createContext, ReactNode, useContext, useEffect} from 'react';
import {Observation} from '../types/observation';
import {
  useCreateObservation,
  useDeleteObservation,
  useFetchObservations,
  useUpdateObservation
} from "../queries/useObservation.ts";
import {CreateObservation} from "../api/observations.ts";

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: CreateObservation) => void;
  updateObservation: (observation: Observation) => void;
  deleteObservation: (id: string) => void;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(undefined);

const STORAGE_KEY = 'kikk_observations';

export function ObservationsProvider({children}: { children: ReactNode }) {
  const {data: observations = []} = useFetchObservations();
  const {mutateAsync: create} = useCreateObservation();
  const {mutateAsync: remove} = useDeleteObservation();
  const {mutateAsync: update} = useUpdateObservation();

  // Save observations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  }, [observations]);

  const addObservation = (observation: CreateObservation) => {
    create(observation);
  };

  const updateObservation = (updatedObservation: Observation) => {
    update(updatedObservation);
  };

  const deleteObservation = (id: string) => {
    remove(id);
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
