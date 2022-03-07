import { ComponentProps } from '../types/component';
import { Global, css, Interpolation } from '@emotion/react'
import { ComponentChildren } from 'preact';

type rootProps = {
    children?: ComponentChildren;
    globalStyle?: Interpolation<{}>;
    class?: string;
};

export default function Root({ globalStyle, class: cls, children }: rootProps) {
    return (
        <div class={cls}>
            <Global styles={globalStyle}></Global>
            {children}
        </div>
    );
}