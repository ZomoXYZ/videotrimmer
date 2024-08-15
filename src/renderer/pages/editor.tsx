import { EditorMain } from '../editor'
import Error from './error'
import { useAsync } from 'react-async'

function Processing() {
	//TODO clean
	return (
		<div>Processing Video</div>
	)
}

async function initFile(path: string) {
	if (!electronAPI) {
		throw 'Cannot access the Electron API'
	}
	return await electronAPI.initFile(path)
}

export default function ({ file }: { file: File }) {
	// const { data, error, isPending } = useAsync(() => initFile(file.path))
	// const { data, error, isPending } = useAsync({ promiseFn: () => initFile(file.path) })
	const state = useAsync({
		promiseFn: () => initFile(file.path),
		watch: file.path,
		onResolve: d => console.log('GOT DATA', d),
		onReject: e => console.error(e),
		onCancel: () => console.error('PROMISE CANCELLED'),
	})
	// const state = useAsync(() => initFile(file.path), [file])

	// useEffect(() => {
	// 	initFile(file.path).then(d => console.log('GOT DATA', d)).catch(e => console.error(e))
	// }, [])

	// useEffect(() => {
	// 	state.promise.then(d => console.log('GOT DATA', d)).catch(e => console.error(e))
	// }, [state])

	console.log(state)

	if (state.error) {
		return <Error message={state.error.toString()} />
	}

	if (state.isPending) {
		return <Processing />
	}

	if (state.data) {
		return (
			<EditorMain file={file} ffprobe={state.data} />
		)
	}

	//TODO clean
	return (
		<div>ASYNC IN UNKNOWN STATE</div>
	)
}
