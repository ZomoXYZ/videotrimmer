import { css } from "@emotion/css";
import { ComponentPropsWithoutRef, useState } from "react";
import { getColor } from "../styles/theme";

export type DropdownOptions = [value: string, label: string][];

interface DropdownProps extends ComponentPropsWithoutRef<"select"> {
	label: string;
	options: DropdownOptions;
}

export default function Dropdown({
	label,
	options,
	disabled = false,
	...props
}: DropdownProps) {
	const [hovering, setHover] = useState(false),
		Color = getColor();

	var dropdownShadowSpread = hovering ? "2px" : "1px",
		dropdownShadowColor = hovering ? Color.dropdown.shadowHover : "transparent";

	return (
		<label
			className={css`
        position: relative;
        display: inline-flex;
        align-items: center;
      `}
			htmlFor={props.id}
			onMouseOver={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<span
				className={css`
          order: -1;
          transition: color 200ms ease-in-out;

          ${disabled &&
					`
					color: ${Color.dropdown.disabled};
				`}
        `}
			>
				{label}
			</span>

			<select
				className={css`
					appearance: none;
					position: relative;
					outline: none;
					background: ${Color.dropdown.background};
					font-size: 14px;
					height: 21px;
					border: none;
					margin: 0;
					margin-left: 5px;
					padding: 0 7px;
					border-radius: 4px;
					transition: box-shadow 0.3s, background 200ms ease-in-out;
					box-shadow: inset 0 0 0 ${dropdownShadowSpread} ${dropdownShadowColor};
					display: inline-block;

          			${disabled && `
						background: ${Color.dropdown.disabled};
						color: ${Color.dropdown.disabled};
					`}
        		`}
				disabled={disabled}
				{...props}
			>
				{options.map((opt) => (
					<option value={opt[0]}>{opt[1]}</option>
				))}
			</select>
		</label>
	);
}
