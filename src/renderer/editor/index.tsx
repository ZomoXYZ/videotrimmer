import { FfprobeData } from 'fluent-ffmpeg';

// the editor components
export function EditorMain({ file, ffprobe }: { file: File; ffprobe: FfprobeData }) {
    const blobUrl = URL.createObjectURL(file)
    return (
        <video src={blobUrl} controls />
    )
}
