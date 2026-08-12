import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { router } from '@/app/router';
import { queryClient } from '@/app/query-client';
import '@/app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      <TanStackRouterDevtools router={router} position="bottom-right" />
    </QueryClientProvider>
  </StrictMode>,
);
