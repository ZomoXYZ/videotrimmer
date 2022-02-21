import { RenderableProps, JSX } from 'preact';

export type ComponentProps<T extends EventTarget> = RenderableProps<JSX.HTMLAttributes<T>>;
export type PageProps<T> = T & {
	path: string;
};