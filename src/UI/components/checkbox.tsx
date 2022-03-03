import { ComponentProps } from '../types/component';
import Theme from '../styles/theme';
import Icon from './icon'
import { css } from '@emotion/css';

type CheckboxProps = ComponentProps<HTMLInputElement> & {
    smaller?: boolean;
    default?: boolean;
};

export default function Checkbox({ checked, label, smaller, default: Default, ...props }: CheckboxProps) {

    var bgColor = Theme.color['dark'].text; //or #bbb if light theme

    return (
        <label class={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        ${smaller ?? 'transform: scale(.7);'}
        `} for={props.id}>

            <input type="checkbox" class={css`
                width: 21px;
                height: 21px;
                -webkit-appearance: none;
                -moz-appearance: none;
                position: relative;
                outline: none;
                background: var(--cb-background);
                border: none;
                margin: 0;
                margin-right: 5px;
                padding: 0;
                border-radius: 4px;
                transition: box-shadow 0.3s,
                    background 200ms ease-in-out;
                box-shadow: inset 0 0 0 var(--s, 1px) var(--b, var(--border));
                display: inline-block;
                &:hover {
                    --s: 2px;
                    --b: var(--border-hover);
                }
                &:checked {
                    --b: var(--border-active);
                }
                `} checked={checked === undefined ? Default : checked} {...props} />

            <Icon.Checkbox class={css`
                width: 21px;
                height: 21px;
                display: block;
                pointer-events: none;
                fill: none;
                stroke-width: 2px;
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke: var(--stroke, var(--border-active));
                position: absolute;
                /*top: 1px;*/
                left: 0;
                width: 21px;
                height: 21px;
                transform: scale(0) translateZ(0);`} />

            <span>{label}</span>

        </label>
    );
}

//remaining css
// need to update these on input checkbox change
`
input:checked {
    --s: 11px;
    & + svg {
        transition: transform 400ms ease-out;
        transform: scale(1) translateZ(0);
    }
}
input:disabled {
    background: var(--border-hover);
    
    ~ span {
        color: var(--border-hover);
    }
}
span {
    transition: color 200ms ease-in-out
}
`