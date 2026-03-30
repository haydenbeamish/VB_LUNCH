import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,          // Data fresh for 2 minutes
      gcTime: 24 * 60 * 60 * 1000,       // Keep cached data for 24 hours
      retry: 1,
      refetchOnWindowFocus: true,         // Refresh when user tabs back
      refetchOnReconnect: true,           // Refresh when network reconnects
      refetchInterval: 5 * 60 * 1000,    // Background poll every 5 minutes
      refetchIntervalInBackground: false, // Only poll when tab is visible
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "bosf-cache",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // Persist for up to 24 hours
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>
);
