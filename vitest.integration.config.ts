import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        globals: true,
        include: ['app/**/*.integration.test.ts', '**/*.integration.test.ts'],
        testTimeout: 30000, // Integration tests might be slower
        hookTimeout: 30000,
    },
});
