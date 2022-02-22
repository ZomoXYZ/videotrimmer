import { ComponentProps } from '../types/component';

type DropdownProps = ComponentProps<HTMLInputElement> & {

};

export default function Dropdown({ ...props }: DropdownProps) {
	return (
		<input {...props} />
	)
}