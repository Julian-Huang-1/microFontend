import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/index.jsx',
  output: {
    file: 'dist/react-app.js',
    format: 'iife',
    name: 'reactApp',
    sourcemap: true,
  },
  plugins: [
    resolve({
      browser: true,
      extensions: ['.js', '.jsx'],
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: ['.js', '.jsx'],
    }),

    replace({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development'
      ),
      preventAssignment: true,
    }),
  ],
};
