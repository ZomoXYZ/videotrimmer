import { ComponentProps } from '../types/component';

type LabelProps = ComponentProps<HTMLLabelElement> & {
    type: string;
};

export default function FileInput({ children, type, ...props }: LabelProps) {
    return (
        <label class="button" {...props}>
            <input type="file" />
            {children}
        </label>
    )
}