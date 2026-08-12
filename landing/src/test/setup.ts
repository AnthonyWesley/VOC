import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  // jsdom não implementa scroll suave usado pelo TanStack Router/âncoras.
  (window as any).scrollTo = () => {};
});
