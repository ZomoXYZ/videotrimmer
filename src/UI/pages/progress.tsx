import Button from '../components/button';
import ProgressBar from '../components/progressbar';
import { PageProps } from '../types/component';

export default function Progress({}: PageProps<{}>) {
	return (
		<div>
			<ProgressBar />
			<Button>Cancel/Done</Button>
			<div>
				<pre></pre>
			</div>
		</div>
	);
}