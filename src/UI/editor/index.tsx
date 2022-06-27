import { ElectronFile } from "../types/electron";
import { FFProbeData } from "../types/ffprobe";

// the editor components
export function EditorMain({ file, ffprobe }: { file: ElectronFile; ffprobe: FFProbeData }) {
    let blobUrl = URL.createObjectURL(file);
    return (
        <video src={blobUrl} controls />
    )
}