// rollup.config.ts
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import { RollupOptions } from 'rollup';

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
      extensions: ['.mjs', '.js', '.ts'],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript(),
    copy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          dest: 'dist/workers',
          rename: 'pdf.worker.min.js',
        },
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs.map',
          dest: 'dist/workers',
          rename: 'pdf.worker.min.js.map',
        },
      ],
    }),
  ],
};

export default config;
