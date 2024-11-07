import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    agGridCommunity: ['ag-grid-community', 'ag-grid-enterprise'],
                    // agGridEnterprise: [],
                    agGridReact: ['ag-grid-react'],
                },
            },
        },
    },
});
