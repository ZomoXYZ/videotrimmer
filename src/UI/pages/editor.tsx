import { useFFProbe } from "../api/ffprobe";
import { ElectronFile } from "../types/electron";

export default function ({ file }: { file: ElectronFile }) {
	const ffprobe = useFFProbe(file)

	if (ffprobe === null) {
		return <Processing />
	}

	console.log(ffprobe)
	return (
		<div>
			<div>{file.name}</div>
		</div>
	);
}

function Processing() {
	return (
		<div>Processing Video</div>
	)
}
