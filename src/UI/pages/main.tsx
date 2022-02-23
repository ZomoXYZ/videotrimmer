import Button from '../components/button';
import ButtonInput from '../components/fileinput';
import Icons from '../components/icon';
import Version from '../components/version';
import { PageProps } from '../types/component';

export default function Main({}: PageProps<{}>) {

	return (
		<div>
			<div>Drag Video To Edit</div>
			<div>or</div>
			<ButtonInput type="file">
				<span>Upload Video</span>
			</ButtonInput>
			<Version />
			<Button>
				<Icons.Cog />
			</Button>
		</div>
	);
}