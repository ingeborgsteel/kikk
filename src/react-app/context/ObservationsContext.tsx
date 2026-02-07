import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Observation } from '../types/observation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbObservation, DbSpeciesObservation } from '../types/database';
import { useAuth } from './AuthContext';

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: Observation) => void;
  updateObservation: (id: string, observation: Observation) => void;
  deleteObservation: (id: string) => void;
  isLoading: boolean;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(undefined);

const STORAGE_KEY = 'kikk_observations';

// Helper function to convert database observation to app observation
function dbToAppObservation(
  dbObs: DbObservation,
  speciesObs: DbSpeciesObservation[]
): Observation {
  return {
    id: dbObs.id,
    location: {
      lat: dbObs.latitude,
      lng: dbObs.longitude,
    },
    uncertaintyRadius: dbObs.uncertainty_radius,
    speciesObservations: speciesObs.map(so => ({
      species: so.species_data,
      gender: so.gender,
      count: so.count,
      comment: so.comment || undefined,
    })),
    date: dbObs.observation_date,
    comment: dbObs.comment || '',
    createdAt: dbObs.created_at,
    updatedAt: dbObs.updated_at,
  };
}

// Helper function to convert app observation to database format
function appToDbObservation(obs: Observation, userId: string | null): {
  observation: Omit<DbObservation, 'created_at' | 'updated_at'>;
  speciesObservations: Omit<DbSpeciesObservation, 'id' | 'observation_id' | 'created_at'>[];
} {
  return {
    observation: {
      id: obs.id,
      user_id: userId,
      latitude: obs.location.lat,
      longitude: obs.location.lng,
      uncertainty_radius: obs.uncertaintyRadius,
      observation_date: obs.date,
      comment: obs.comment || null,
    },
    speciesObservations: obs.speciesObservations.map(so => ({
      species_data: so.species,
      gender: so.gender,
      count: so.count,
      comment: so.comment || null,
    })),
  };
}

export function ObservationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load observations from Supabase or localStorage on mount
  useEffect(() => {
    const loadObservations = async () => {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        // Fallback to localStorage if Supabase is not configured
        const stored = localStorage.getItem(STORAGE_KEY);
        setObservations(stored ? JSON.parse(stored) : []);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch observations from Supabase
        // Get observations for the current user or anonymous observations
        const { data: obsData, error: obsError } = await supabase
          .from('observations')
          .select('*')
          .or(user ? `user_id.eq.${user.id},user_id.is.null` : 'user_id.is.null')
          .order('created_at', { ascending: false });

        if (obsError) {
          console.error('Error fetching observations:', obsError);
          // Fallback to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          setObservations(stored ? JSON.parse(stored) : []);
          setIsLoading(false);
          return;
        }

        if (!obsData || obsData.length === 0) {
          setObservations([]);
          setIsLoading(false);
          return;
        }

        // Fetch all species observations for these observations
        const observationIds = obsData.map(o => o.id);
        const { data: speciesData, error: speciesError } = await supabase
          .from('species_observations')
          .select('*')
          .in('observation_id', observationIds);

        if (speciesError) {
          console.error('Error fetching species observations:', speciesError);
          setObservations([]);
          setIsLoading(false);
          return;
        }

        // Combine observations with their species observations
        const combined = obsData.map(obs => {
          const species = speciesData?.filter(s => s.observation_id === obs.id) || [];
          return dbToAppObservation(obs as DbObservation, species as DbSpeciesObservation[]);
        });

        setObservations(combined);
      } catch (error) {
        console.error('Error loading observations:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        setObservations(stored ? JSON.parse(stored) : []);
      } finally {
        setIsLoading(false);
      }
    };

    loadObservations();
  }, [user]);

  // Save observations to localStorage as backup whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
    }
  }, [observations, isLoading]);

  const addObservation = async (observation: Observation) => {
    if (!isSupabaseConfigured()) {
      // Fallback to localStorage
      setObservations(prev => [...prev, observation]);
      return;
    }

    try {
      const { observation: obsData, speciesObservations } = appToDbObservation(
        observation,
        user?.id || null
      );

      // Insert the observation
      const { data: insertedObs, error: obsError } = await supabase
        .from('observations')
        .insert(obsData)
        .select()
        .single();

      if (obsError) {
        console.error('Error adding observation:', obsError);
        // Fallback to local state
        setObservations(prev => [...prev, observation]);
        return;
      }

      // Insert species observations
      const speciesWithObsId = speciesObservations.map(so => ({
        ...so,
        observation_id: insertedObs.id,
      }));

      const { data: insertedSpecies, error: speciesError } = await supabase
        .from('species_observations')
        .insert(speciesWithObsId)
        .select();

      if (speciesError) {
        console.error('Error adding species observations:', speciesError);
        // Still add to local state even if species insertion fails
        setObservations(prev => [...prev, observation]);
        return;
      }

      // Add to local state with fresh data from DB
      const newObservation = dbToAppObservation(
        insertedObs as DbObservation,
        insertedSpecies as DbSpeciesObservation[]
      );
      setObservations(prev => [newObservation, ...prev]);
    } catch (error) {
      console.error('Error adding observation:', error);
      // Fallback to local state
      setObservations(prev => [...prev, observation]);
    }
  };

  const updateObservation = async (id: string, updatedObservation: Observation) => {
    if (!isSupabaseConfigured()) {
      // Fallback to localStorage
      setObservations(prev =>
        prev.map(obs => obs.id === id ? updatedObservation : obs)
      );
      return;
    }

    try {
      const { observation: obsData, speciesObservations } = appToDbObservation(
        updatedObservation,
        user?.id || null
      );

      // Update the observation
      const { error: obsError } = await supabase
        .from('observations')
        .update({
          latitude: obsData.latitude,
          longitude: obsData.longitude,
          uncertainty_radius: obsData.uncertainty_radius,
          observation_date: obsData.observation_date,
          comment: obsData.comment,
        })
        .eq('id', id);

      if (obsError) {
        console.error('Error updating observation:', obsError);
        // Fallback to local state
        setObservations(prev =>
          prev.map(obs => obs.id === id ? updatedObservation : obs)
        );
        return;
      }

      // Delete existing species observations
      const { error: deleteError } = await supabase
        .from('species_observations')
        .delete()
        .eq('observation_id', id);

      if (deleteError) {
        console.error('Error deleting species observations:', deleteError);
      }

      // Insert new species observations
      const speciesWithObsId = speciesObservations.map(so => ({
        ...so,
        observation_id: id,
      }));

      const { error: speciesError } = await supabase
        .from('species_observations')
        .insert(speciesWithObsId);

      if (speciesError) {
        console.error('Error inserting species observations:', speciesError);
        // Still update local state even if species insertion fails
        setObservations(prev =>
          prev.map(obs => obs.id === id ? updatedObservation : obs)
        );
        return;
      }

      // Update local state
      setObservations(prev =>
        prev.map(obs => obs.id === id ? updatedObservation : obs)
      );
    } catch (error) {
      console.error('Error updating observation:', error);
      // Fallback to local state
      setObservations(prev =>
        prev.map(obs => obs.id === id ? updatedObservation : obs)
      );
    }
  };

  const deleteObservation = async (id: string) => {
    if (!isSupabaseConfigured()) {
      // Fallback to localStorage
      setObservations(prev => prev.filter(obs => obs.id !== id));
      return;
    }

    try {
      // Delete the observation (species observations will be deleted via CASCADE)
      const { error } = await supabase
        .from('observations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting observation:', error);
      }

      // Update local state regardless
      setObservations(prev => prev.filter(obs => obs.id !== id));
    } catch (error) {
      console.error('Error deleting observation:', error);
      // Still update local state
      setObservations(prev => prev.filter(obs => obs.id !== id));
    }
  };

  return (
    <ObservationsContext.Provider value={{ observations, addObservation, updateObservation, deleteObservation, isLoading }}>
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
