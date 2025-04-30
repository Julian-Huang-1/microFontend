import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import vue from 'rollup-plugin-vue';
import postcss from 'rollup-plugin-postcss';
export default {
  input: 'src/main.js',
  output: {
    file: 'dist/vue-app.js',
    format: 'iife',
    name: 'vueApp',
    sourcemap: true,
  },
  plugins: [
    resolve({
      browser: true,
    }),
    vue(),
    postcss({
      extensions: ['.css'],
      extract: false, // Inject CSS into the bundle
      minimize: process.env.NODE_ENV === 'production',
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development'
      ),
      preventAssignment: true,
    }),
  ],
};
