import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Pure-module test config (spec decision #19): node env, lib tests only.
// The '@' alias mirrors tsconfig paths so the config is future-proof even
// though src/data/profiles.ts uses a type-only '@/lib/roundup' import (erased).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname ?? '.', 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
  },
})
