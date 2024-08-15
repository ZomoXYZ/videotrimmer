import { ffprobePath } from 'ffmpeg-ffprobe-static'
import { FfprobeData, ffprobe as fluentFfprobe } from 'fluent-ffmpeg'
console.log(ffprobePath)

export default function ffprobe(path: string): Promise<FfprobeData> {
    return new Promise((resolve, reject) => {
        if (ffprobePath === null) {
            reject('ffprobe missing')
            return
        }

        fluentFfprobe(path, (err, data) => {
            if (err as Error | null) {
                console.log('ffprobe err')
                // console.log(err)
                reject(err)
            } else {
                console.log('ffprobe data')
                // console.log(data)
                resolve(data)
            }
        })
    })
}
