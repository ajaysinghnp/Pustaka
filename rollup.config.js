import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'packages/core/index.ts',
  output: [
    {
      file: 'dist/pustaka.umd.js',
      format: 'umd',
      name: 'Pustaka',
    },
    {
      file: 'dist/pustaka.esm.js',
      format: 'esm',
    },
  ],
  plugins: [nodeResolve(), typescript()],
};
