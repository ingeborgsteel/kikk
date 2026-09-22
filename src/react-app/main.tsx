import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.tsx";
import { ObservationsProvider } from "./context/ObservationsContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { LocationsProvider } from "./context/LocationsContext.tsx";
import { MapPreferencesProvider } from "./context/MapPreferencesContext.tsx";
import { GeolocationProvider } from "./context/GeolocationContext.tsx";
import { FeatureAlertsProvider } from "./context/FeatureAlertsContext.tsx";
import { LoginGate } from "./components/LoginGate.tsx";
import { SplashScreen } from "./components/SplashScreen.tsx";
import "dayjs/locale/nb";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days — keep cache for offline use
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "kikk-query-cache",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          // Dismissals have their own localStorage key (guests) / server
          // endpoint (auth) — a persisted copy could hydrate stale and shadow
          // the real store without a refetch (still within staleTime).
          shouldDehydrateQuery: (query) =>
            query.queryKey[0] !== "feature-alert-dismissals",
        },
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <LoginGate>
              <GeolocationProvider>
                <MapPreferencesProvider>
                  <LocationsProvider>
                    <ObservationsProvider>
                      <FeatureAlertsProvider>
                        <App />
                      </FeatureAlertsProvider>
                    </ObservationsProvider>
                  </LocationsProvider>
                </MapPreferencesProvider>
              </GeolocationProvider>
            </LoginGate>
            <SplashScreen />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
