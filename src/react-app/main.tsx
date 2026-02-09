import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ObservationsProvider } from "./context/ObservationsContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { LocationsProvider } from "./context/LocationsContext.tsx";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ThemeProvider>
					<LocationsProvider>
						<ObservationsProvider>
							<App />
						</ObservationsProvider>
					</LocationsProvider>
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	</StrictMode>,
);
