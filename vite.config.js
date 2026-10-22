import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Without the React plugin Vite falls back to the classic JSX transform and every
// component file that does not `import React` fails at runtime.
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
});
