const { build } = require('esbuild')


build({

    entryPoints: ['src/UI/App.tsx'],

    outdir: 'dist/UI',

    bundle: true,

})