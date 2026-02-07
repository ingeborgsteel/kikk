import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Observation } from '../types/observation';

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: Observation) => void;
  updateObservation: (id: string, observation: Observation) => void;
  deleteObservation: (id: string) => void;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(undefined);

const STORAGE_KEY = 'kikk_observations';

export function ObservationsProvider({ children }: { children: ReactNode }) {
  const [observations, setObservations] = useState<Observation[]>(() => {
    // Load observations from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save observations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  }, [observations]);

  const addObservation = (observation: Observation) => {
    setObservations(prev => [...prev, observation]);
  };

  const updateObservation = (id: string, updatedObservation: Observation) => {
    setObservations(prev => 
      prev.map(obs => obs.id === id ? updatedObservation : obs)
    );
  };

  const deleteObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id));
  };

  return (
    <ObservationsContext.Provider value={{ observations, addObservation, updateObservation, deleteObservation }}>
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
