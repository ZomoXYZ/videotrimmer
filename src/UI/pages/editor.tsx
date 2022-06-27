import { useFFProbe } from "../api/ffprobe";
import { EditorMain } from "../editor";
import { ElectronFile } from "../types/electron";

export default function ({ file }: { file: ElectronFile }) {
	const ffprobe = useFFProbe(file)

	if (ffprobe === null) {
		return <Processing />
	}

	console.log(ffprobe)
	return (
		<EditorMain file={file} ffprobe={ffprobe} />
	);
}

function Processing() {
	return (
		<div>Processing Video</div>
	)
}
