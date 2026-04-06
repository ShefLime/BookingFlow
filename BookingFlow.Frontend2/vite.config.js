import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    router: ['react-router-dom'],
                    query: ['@tanstack/react-query'],
                    i18n: ['i18next', 'react-i18next'],
                    keycloak: ['keycloak-js'],
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5282',
                changeOrigin: true,
            },
        },
    },
    preview: {
        proxy: {
            '/api': {
                target: 'http://localhost:5282',
                changeOrigin: true,
            },
        },
    },
});
