import { getColor } from "../styles/theme";
import Icon from "./icon";
import { css } from "@emotion/css";
import { ComponentPropsWithoutRef, useState } from "react";

interface CheckboxProps extends ComponentPropsWithoutRef<"input"> {
    label?: string;
    smaller?: boolean;
}

export default function Checkbox({
    checked: checkedDefault = false,
    label,
    smaller = false,
    disabled = false,
    ...props
}: CheckboxProps) {
    const [checked, setChecked] = useState(checkedDefault),
        [hovering, setHover] = useState(false),
        Color = getColor();

    if (checked && disabled) setChecked(false);

    var bgColor = disabled ? Color.checkbox.disabled : Color.checkbox.background;

    var inputShadowSpread = checked ? "11px" : hovering ? "2px" : "1px",
        inputShadowColor = checked
            ? Color.checkbox.shadowActive
            : hovering
                ? Color.checkbox.shadowHover
                : "transparent";

    return (
        <label
            className={css`
                position: relative;
                display: inline-flex;
                align-items: center;
                ${smaller && "transform: scale(.7);"}
            `}
            htmlFor={props.id}
            onMouseOver={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <input
                type="checkbox"
                className={css`
                    width: 21px;
                    height: 21px;
                    appearance: none;
                    position: relative;
                    outline: none;
                    background: ${bgColor};
                    border: none;
                    margin: 0;
                    margin-right: 5px;
                    padding: 0;
                    border-radius: 4px;
                    transition: box-shadow 0.3s, background 200ms ease-in-out;
                    box-shadow: inset 0 0 0 ${inputShadowSpread} ${inputShadowColor};
                    display: inline-block;
                `}
                disabled={disabled}
                checked={checked}
                onChange={({ target }: { target: EventTarget | null }) => {
                    if (target) {
                        const { checked } = target as HTMLInputElement;
                        setChecked(checked);
                    }
                }}
                {...props}
            />

            <Icon.Checkbox
                className={css`
                    width: 21px;
                    height: 21px;
                    display: block;

                    pointer-events: none;
                    fill: none;
                    stroke-width: 2px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke: ${Color.text};
                    position: absolute;
                    left: 0;
                    transform: scale(${checked ? 1 : 0}) translateZ(0);

                    ${checked && `transition: transform 400ms ease-out;`}
        `}
            />

            <span
                className={css`
                    transition: color 200ms ease-in-out;
                    ${disabled && `color: ${Color.checkbox.disabled};`}
                `}
            >
                {label}
            </span>
        </label>
    );
}
