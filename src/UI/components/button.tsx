import { ComponentProps } from '../types/component';
import { css } from '@emotion/css'
import { getColor } from '../styles/theme';

type LabelProps = ComponentProps<HTMLLabelElement> & {
	type?: "button" | "file";
};

export default function Button({ children, type = "button", ...props }: LabelProps) {

	const Color = getColor();

	return (
		<label class={css`
		margin-top: 3px;
		padding: 6px 8px;
		border-radius: 4px;
		
		background: ${Color.button.background};
		border: 1px solid ${Color.button.border};

		&:hover {
			background: ${Color.button.backgroundHover};
		}
		&:active {
			background: ${Color.button.backgroundActive};
		}
		`} {...props}>
			<input class={css`
			display: none;
			`} type={type} />
			<span>{children}</span>
		</label>
	)
}