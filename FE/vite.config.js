import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
        port: 5173,
        strictPort: true,
    }
})