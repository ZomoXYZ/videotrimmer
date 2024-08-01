import path from 'path'
import { name as AppName } from '../../package.json'

export function getAppDataPath() {
    switch (process.platform) {
        case 'darwin':
            if (process.env.HOME !== undefined)
                return path.join(
                    process.env.HOME,
                    'Library',
                    'Application Support',
                    AppName
                )
            throw 'Missing Environmental Variable $HOME'
        case 'win32':
            if (process.env.APPDATA !== undefined)
                return path.join(process.env.APPDATA, AppName)
            throw 'Missing Environmental Variable $APPDTA`'
        case 'linux':
            if (process.env.HOME !== undefined)
                return path.join(process.env.HOME, '.' + AppName)
            throw 'Missing Environmental Variable $HOME'
        default:
            throw `Unsupported platform ${process.platform}`
    }
}

// type EventsT<E extends string, A extends []> = {
//     on: (event: E, handler: (...args: A) => void) => void
// }

// export function asyncOn<
//     E extends string,
//     A extends [],
//     T extends EventsT<E, A>,
// >(events: T, event: E): Promise<A> {
//     return new Promise((resolve) => {
//         events.on(event, (...args: A) => {
//             resolve(args)
//         })
//     })
// }

// export function asyncIPC<T>(event: string): Promise<T> {
//     return new Promise((resolve) => {
//         ipcMain.once(event, (_, arg: T) => {
//             resolve(arg)
//         })
//     })
// }
