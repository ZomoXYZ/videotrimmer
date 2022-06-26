const { build } = require("esbuild"),
    args = require("command-line-args")([
        { name: "watch", alias: "w", type: Boolean, defaultValue: false },
        { name: "bundle", alias: "b", type: Boolean, defaultValue: false },
        { name: "minify", alias: "m", type: Boolean, defaultValue: false },
        { name: "sourcemap", alias: "s", type: Boolean, defaultValue: false },
    ]);

// API
build({
    entryPoints: ["src/API/main.ts"],

    target: "node16",
    platform: "node",
    format: "cjs",

    outdir: "dist/API",

    bundle: false,
    watch: args.watch,
    minify: args.minify,
    sourcemap: args.sourcemap,
});
