import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest configuration for the back-office.
// Default environment is jsdom (client/React tests). Server tests opt into
// the node environment via a `// @vitest-environment node` docblock so they
// run without a DOM. No test touches a real DB, network or S3 bucket.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    },
  },
});
