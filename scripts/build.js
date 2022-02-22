const { build } = require('esbuild')

// API
build({

    entryPoints: ['src/API/main.ts'],

    target: 'node16',
    platform: 'node',

    outdir: 'dist/API',

    bundle: true,

});

// UI
build({

    entryPoints: ['src/UI/App.tsx'],

    outdir: 'dist/UI',

    bundle: true,

});