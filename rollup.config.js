// rollup.config.js

import pkg from './package.json'

import { eslint } from 'rollup-plugin-eslint'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/main.js',
  output: {
    file: pkg.main,
    format: 'umd',
    name: 'MVVM'
  },
  plugins: [
    eslint({
      throwOnError: true,
      throwOnWarning: true,
      include: ['src/**']
    }),
    terser()
  ]
}
