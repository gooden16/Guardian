import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // This is the key configuration for Fast Refresh
      fastRefresh: true,
      // Include all the necessary files
      include: "**/*.{jsx,tsx}",
      // Exclude node_modules
      exclude: "**/node_modules/**"
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', '@headlessui/react']
  }
});