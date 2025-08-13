import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "./styles/index.css"
import { Router } from "./routes.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster position='top-right' />
    </QueryClientProvider>
  </StrictMode>
)
