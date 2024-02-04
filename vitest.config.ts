import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    root: resolve('./'),

    reporters: ['verbose'],

    coverage: {
      provider: 'v8',
      all: true,
      include: [
        '**/src/**',
      ],
      exclude: [
        '**/doc/**/*',
        '**/*.d.ts',
      ],
    },

    include: [
      '**/src/**/*.spec.ts',
    ],

    setupFiles: [],
  },

  resolve: {
    alias: {
      '~': resolve('./'),
    },
  },
})
