import { h } from 'preact';
import { ComponentProps } from '../types/component';

type ButtonProps = ComponentProps<HTMLButtonElement> & {

};

export default function Button({ children, ...props }: ButtonProps) {
	return (
		<button {...props}>
			{children}
		</button>
	)
}