import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import * as stringPlugin from 'rollup-plugin-string';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

// Equivalent of __filename and __dirname in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle CommonJS default export in ESM:
const string = stringPlugin.default || ((opts) => stringPlugin(opts));

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
          find: 'pdfjs-dist/build/pdf.worker.entry.js',
          replacement: path.resolve(
            __dirname,
            'node_modules/pdfjs-dist/build/pdf.worker.entry.js',
          ),
        },
      ],
    }),
    nodeResolve(),
    string({
      include: '**/pdf.worker.entry.js',
    }),
    typescript(),
  ],
};
