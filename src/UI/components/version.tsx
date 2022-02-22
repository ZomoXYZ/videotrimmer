import { useEffect, useRef } from 'preact/hooks';
import { version } from '../../../package.json';

const FETCHURL = 'https://raw.githubusercontent.com/ZomoXYZ/videotrimmer/master/package.json';

export default function Version() {
	const versionRef = useRef<HTMLDivElement|null>(null);

	async function fetchNewVersion() {
        let packageJSON = await (await fetch(FETCHURL)).json();
        
        let currentVersion = version.split('.'),
            newVersion = packageJSON.version.split('.');

        for (let i = 0; i < 3; i++) {
            let cv = parseInt(currentVersion[i]),
                nv = parseInt(newVersion[i]);
            if (nv > cv) {
                return true;
            } else if (cv > nv)
                break;
        }

        return false;
	}

	useEffect(() => {
		fetchNewVersion().then(hasUpdate => {
			if (versionRef.current && hasUpdate) {
				versionRef.current.classList.add('update');
			}
		});
	}, []);

	return (
		<div id="version" ref={versionRef}>{version}</div>
	)
}