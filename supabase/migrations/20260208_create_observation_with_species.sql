-- Create a function to atomically insert an observation with its species observations
-- This ensures that if any part of the insert fails, the entire operation is rolled back

CREATE OR REPLACE FUNCTION create_observation_with_species(
  observation_data jsonb,
  species_observations_data jsonb,
  user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_observation jsonb;
  observation_id uuid;
BEGIN
  -- Insert the observation
  INSERT INTO observations (
    location,
    "locationName",
    "uncertaintyRadius",
    "startDate",
    "endDate",
    comment,
    "userId"
  )
  VALUES (
    (observation_data->>'location')::jsonb,
    observation_data->>'locationName',
    (observation_data->>'uncertaintyRadius')::integer,
    (observation_data->>'startDate')::timestamp with time zone,
    (observation_data->>'endDate')::timestamp with time zone,
    observation_data->>'comment',
    user_id
  )
  RETURNING id INTO observation_id;

  -- Insert species observations if any
  IF jsonb_array_length(species_observations_data) > 0 THEN
    INSERT INTO "speciesObservations" (
      "observationId",
      species,
      gender,
      count,
      age,
      method,
      activity,
      comment
    )
    SELECT
      observation_id,
      (elem->>'species')::jsonb,
      (elem->>'gender')::text,
      (elem->>'count')::integer,
      elem->>'age',
      elem->>'method',
      elem->>'activity',
      elem->>'comment'
    FROM jsonb_array_elements(species_observations_data) AS elem;
  END IF;

  -- Return the complete observation with species observations
  SELECT jsonb_build_object(
    'id', o.id,
    'location', o.location,
    'locationName', o."locationName",
    'uncertaintyRadius', o."uncertaintyRadius",
    'startDate', o."startDate",
    'endDate', o."endDate",
    'comment', o.comment,
    'userId', o."userId",
    'createdAt', o."createdAt",
    'updatedAt', o."updatedAt",
    'speciesObservations', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'species', s.species,
            'gender', s.gender,
            'count', s.count,
            'age', s.age,
            'method', s.method,
            'activity', s.activity,
            'comment', s.comment
          )
        )
        FROM "speciesObservations" s
        WHERE s."observationId" = o.id
      ),
      '[]'::jsonb
    )
  )
  INTO inserted_observation
  FROM observations o
  WHERE o.id = observation_id;

  RETURN inserted_observation;
END;
$$;
