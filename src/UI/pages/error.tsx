import { PageProps } from '../types/component';

export default function Error({}: PageProps<{}>) {
	return (
		<div>
			<div>
				<div class="bold">Error</div>
				<div class="small">Click here to open the console</div>
			</div>
			<div>
				<pre></pre>
			</div>
		</div>
	);
}