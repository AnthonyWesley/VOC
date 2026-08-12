import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { HomePage } from '@/features/home/HomePage';

function renderHomePage() {
  const rootRoute = createRootRoute({});
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('renders feedback when the API is unreachable', async () => {
    renderHomePage();

    expect(await screen.findByText(/erro ao carregar a landing page/i)).toBeInTheDocument();
  });
});