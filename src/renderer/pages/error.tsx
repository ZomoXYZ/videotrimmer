export default function Error({ message }: { message: string }) {
	return (
		<div>
			<div>
				<div className="bold">Error</div>
				<div className="small">Click here to open the console</div>
			</div>
			<div>
				<pre>{message}</pre>
			</div>
		</div>
	)
}
