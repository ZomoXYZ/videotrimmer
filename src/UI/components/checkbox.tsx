import { ComponentProps } from '../types/component';

type CheckboxProps = ComponentProps<HTMLInputElement> & {
    default?: boolean;
};

export default function Checkbox({ checked, default: Default, ...props }: CheckboxProps) {
    return (
        <label for={props.id}>
            <input type="checkbox"
                checked={checked == undefined ? Default : checked}
                {...props}
                style={{ display: 'none' }}
                />
            
            <svg viewBox='0 0 21 21'>
                <polyline points="5 10.75 8.5 14.25 16 6" />
            </svg>
            <span>{props.label}</span>
        </label>
    );
}