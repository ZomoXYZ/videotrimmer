import { css } from '@emotion/css';
import Button from '../components/button';
import Icons from '../components/icon';
import Version from '../components/version';
import { getColor, getFont } from '../styles/theme';
import { PageProps } from '../types/component';

export default function Main({}: PageProps<{}>) {

	const Color = getColor(),
		Font = getFont();

	return (
		<div>
			<div>Drag Video To Edit</div>
			<div>or</div>
			<Button type="file">
				Click to Choose File
			</Button>
			<Version class={css`
				position: fixed;
				bottom: 10px;
				left: 10px;
				font-size: ${Font.size.version};
			`} />
			<Button class={css`
				position: fixed;
				bottom: 10px;
				right: 10px;
				padding: 4px;
			`}>
				<Icons.Cog class={css`
					fill: ${Color.text};
					width: 22px;
				`} />
			</Button>
		</div>
	);
}