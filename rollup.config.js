import pascalCase from 'pascal-case';
import commonjs from 'rollup-plugin-commonjs';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

export default {
  input: 'es/index.js',
  output: {
    name: pascalCase(pkg.name),
    file: 'dist/bundle.js',
    format: 'umd',
    exports: 'named',
    sourcemap: true,
    amd: {
      id: pkg.name,
    },
  },
  plugins: [sourcemaps(), nodeResolve(), nodeGlobals(), nodeBuiltins(), commonjs(), terser()],
  external: ['react', 'react-dom', 'redux', 'react-redux'],
};
