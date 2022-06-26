import { css } from "@emotion/css";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import { getColor } from "../styles/theme";
import { composite } from "../util/css";
import MimeDB from 'mime-db';
const MimeDBTypes = Object.keys(MimeDB);
interface LabelProps {
	accept?: string[] | string;
	children?: ReactNode;
	className?: string;
	type?: "button" | "file";
	label?: ComponentPropsWithoutRef<"label">;
	input?: ComponentPropsWithoutRef<"input">;
}

export default function Button({
	accept,
	children,
	className,
	type = "button",
	label = {},
	input = {},
}: LabelProps) {
	const Color = getColor();

	// html's mime types are not accurate, this changes video/* to video/mp4,video/ogg,video/webm,...
	if (typeof accept === 'string') {
		accept = [accept];
	}
	const accepts = accept?.map(m => {
		let mimeSearch = m.split('/')
		return MimeDBTypes.filter(t => {
			let mime = t.split('/')
			if (mimeSearch[0] === mime[0] && (mimeSearch[1] === mime[1] || mimeSearch[1] === '*')) {
				return true
			}
			return false
		})
	}).flat().join(',')

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
			{...label}
		>
			<input
				className={css`
					display: none;
				`}
				type={type}
				accept={accepts}
				{...input}
			/>
			<span>{children}</span>
		</label>
	);
}
