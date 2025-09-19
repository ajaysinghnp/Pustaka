import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/pustaka.esm.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/pustaka.cjs.js',
        format: 'cjs',
        sourcemap: true
      }
    ],
    external: ['pdfjs-dist'],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/types',
        rootDir: 'src'
      })
    ]
  }
];