import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  plugins: [
    alias({
      entries: [
        {
          find: 'pdfjs-dist/build/pdf.worker.min',
          replacement: path.resolve(
            __dirname,
            'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          ),
        },
      ],
    }),
    nodeResolve(),
    url({
      include: ['**/pdf.worker.entry.js', '**/pdf.worker.js', '**/*.worker.js'],
      limit: 0,
      emitFiles: true,
      fileName: '[name][extname]',
    }),
    typescript(),
  ],
};
