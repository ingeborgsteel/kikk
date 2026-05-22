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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { nbNO } from "@mui/x-date-pickers/locales";
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
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb" localeText={nbNO.components.MuiLocalizationProvider.defaultProps.localeText}>
          <ThemeProvider>
            <GeolocationProvider>
              <MapPreferencesProvider>
                <LocationsProvider>
                  <ObservationsProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </ObservationsProvider>
                </LocationsProvider>
              </MapPreferencesProvider>
            </GeolocationProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
