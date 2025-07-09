import typescript from '@rollup/plugin-typescript';
import type { RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';

const config: RollupOptions = {
  input: 'packages/core/index.ts',
  output: [
    {
      file: 'dist/pustaka.umd.js',
      format: 'umd',
      name: 'Pustaka',
      sourcemap: true,
    },
    {
      file: 'dist/pustaka.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/pustaka.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve({
      extensions: ['.mjs', '.js'], // Handle .mjs files
      preferBuiltins: true,
    }),
    typescript(),
    url({
      include: ['**/pdf.worker.min.mjs'],
      limit: 0, // Always emit as file
      fileName: '[name][extname]',
    }),
  ],
  // external: Object.keys(pkg.dependencies),
};

export default config;
