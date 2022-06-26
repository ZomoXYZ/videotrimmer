import { css } from "@emotion/css";
import { ComponentPropsWithoutRef } from "react";
import { getColor } from "../styles/theme";
import { composite } from "../util/css";

interface LabelProps extends ComponentPropsWithoutRef<"label"> {
	type?: "button" | "file";
}

export default function Button({
	children,
	type = "button",
	className,
	...props
}: LabelProps) {
	const Color = getColor();

	return (
		<label
			className={composite(
				className,
				css`
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
				`
			)}
			{...props}
		>
			<input
				className={css`
					display: none;
				`}
				type={type}
			/>
			<span>{children}</span>
		</label>
	);
}
