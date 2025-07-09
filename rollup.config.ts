import typescript from '@rollup/plugin-typescript';
import type { RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'node:url';

// Equivalent of __filename and __dirname in ES modules:
const __pdf_worker = fileURLToPath(
  new URL('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
);

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
    alias({
      entries: [
        {
          find: 'pdfjs-dist/build/pdf.worker.entry.js',
          replacement: __pdf_worker,
        },
      ],
    }),
    nodeResolve(),
    typescript(),
  ],
  // external: Object.keys(pkg.dependencies),
};

export default config;
