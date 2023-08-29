import { defineConfig } from 'vite';
import replace from 'rollup-plugin-replace';
// import { terser } from 'rollup-plugin-terser';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/prose-editor.ts',
      name: 'ProseEditor',
    },

    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      // preserveModules: false,
      output: [
        {
          dir: 'dist',
          formats: ['es'],
          entryFileNames: '[name].js', // [name].js'
        },
      ],
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
      ],
    },
  },
});
