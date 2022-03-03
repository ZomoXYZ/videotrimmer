import { ComponentProps } from '../types/component';
import { css } from '@emotion/css'
import Theme from '../styles/theme';

type LabelProps = ComponentProps<HTMLLabelElement> & {
	type?: "button" | "file";
};

export default function Button({ children, type = "button", ...props }: LabelProps) {
	return (
		<label class={css`
		margin-top: 3px;
		padding: 6px 8px;
		border-radius: 4px;
		
		background: ${Theme.color['dark'].button.background};
		border: 1px solid ${Theme.color['dark'].button.border};

		&:hover {
			background: ${Theme.color['dark'].button.backgroundHover};
		}
		&:active {
			background: ${Theme.color['dark'].button.backgroundActive};
		}
		`} {...props}>
			<input class={css`
			display: none;
			`} type={type} />
			<span>{children}</span>
		</label>
	)
}