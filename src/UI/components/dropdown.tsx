import { ComponentProps } from '../types/component';

export type DropdownOptions = [value: string, label: string][];

type DropdownProps = ComponentProps<HTMLSelectElement> & {
	label: string,
	options: DropdownOptions
};

export default function Dropdown({ label, options, ...props }: DropdownProps) {
	return (
		<label>
			<span>{label}</span>
			<select {...props}>
				{
					options.map(opt => <option value={opt[0]}>{opt[1]}</option>)
				}
			</select>
		</label>
	)
}