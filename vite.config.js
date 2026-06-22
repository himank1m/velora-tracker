import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
          if (id.includes('lucide-react')) return 'icons-vendor';
          return undefined;
        },
      },
    },
  },
});
