import { defineConfig } from 'vite';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: ['src/prose-editor.ts'],
      name: 'ProseEditor',
    },
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      // preserveModules: false,
      output: [
        {
          dir: 'dist',
          format: 'es',
          entryFileNames: '[name].js', // [name].js'
        },
      ],
    },
  },
});
