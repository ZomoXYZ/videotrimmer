import Button from '../components/button';
import Icons from '../components/icon';
import Version from '../components/version';
import { PageProps } from '../types/component';

export default function Main({}: PageProps<{}>) {

	return (
		<div>
			<div>Drag Video To Edit</div>
			<div>or</div>
			<Button type="file">
				Upload Video
			</Button>
			<Version />
			<Button>
				<Icons.Cog />
			</Button>
		</div>
	);
}