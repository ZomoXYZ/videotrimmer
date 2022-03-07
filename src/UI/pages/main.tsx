import { css } from '@emotion/css';
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
			<Version class={css`
				position: fixed;
				bottom: 10px;
				left: 10px;
				font-size: 12px;
			`} />
			<Button>
				<Icons.Cog />
			</Button>
		</div>
	);
}