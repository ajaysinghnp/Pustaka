import typescript from '@rollup/plugin-typescript';
import type { RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import pkg from './package.json' assert { type: 'json' };
import path from 'path';
import { fileURLToPath } from 'url';

// Equivalent of __filename and __dirname in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: RollupOptions = {
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
    typescript(),
  ],
  external: Object.keys(pkg.dependencies),
};

export default config;
