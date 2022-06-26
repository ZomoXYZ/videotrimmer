import { useEffect, useRef } from "react";
import { APP_VERSION } from "../util/version";

const FETCHURL =
	"https://raw.githubusercontent.com/ZomoXYZ/videotrimmer/master/package.json";

interface versionProps {
	className?: string;
}

export default function Version({ className }: versionProps) {
	const versionRef = useRef<HTMLDivElement | null>(null);

	async function fetchNewVersion() {
		let packageJSON = await (await fetch(FETCHURL)).json();

		let currentVersion = APP_VERSION.split("."),
			newVersion = packageJSON.version.split(".");

		for (let i = 0; i < 3; i++) {
			let cv = parseInt(currentVersion[i]),
				nv = parseInt(newVersion[i]);
			if (nv > cv) {
				return true;
			} else if (cv > nv) {
				break;
			}
		}

		return false;
	}

	useEffect(() => {
		fetchNewVersion().then((hasUpdate) => {
			if (versionRef.current !== null && hasUpdate) {
				versionRef.current.classList.add("update");
			}
		});
	}, []);

	return (
		<div id="version" className={className} ref={versionRef}>
			v{APP_VERSION}
		</div>
	);
}
