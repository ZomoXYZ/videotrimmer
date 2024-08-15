/**
 * accessible in the renderer after the preload script
 */
declare const electronAPI:
    | typeof import('./src/preload/api').default
    | undefined
