import { css } from '@emotion/css';
import { ComponentChildren } from 'preact';
import { getAccessibility } from '../styles/theme';

interface rootProps {
    children?: ComponentChildren;
    class?: string;
};

export default function Root({ class: cls, children }: rootProps) {

    const Filter = getAccessibility();

    return (
        <div class={css`
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-Bold.ttf);
                font-weight: bold;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-BoldItalic.ttf);
                font-weight: bold;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-ExtraBold.ttf);
                font-weight: bolder;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-ExtraBoldItalic.ttf);
                font-weight: bolder;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-Italic.ttf);
                font-weight: normal;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-Light.ttf);
                font-weight: lighter;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-LightItalic.ttf);
                font-weight: lighter;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-Regular.ttf);
                font-weight: normal;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-SemiBold.ttf);
                font-weight: 600;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(../resources/Open_Sans/OpenSans-SemiBoldItalic.ttf);
                font-weight: 600;
                font-style: italic;
            }

            @font-face {
                font-family: OpenDyslexic;
                src: url(../resources/OpenDyslexic2/OpenDyslexic-Bold.otf);
                font-weight: bold;
                font-style: normal;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(../resources/OpenDyslexic2/OpenDyslexic-BoldItalic.otf);
                font-weight: bold;
                font-style: italic;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(../resources/OpenDyslexic2/OpenDyslexic-Italic.otf);
                font-weight: normal;
                font-style: italic;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(../resources/OpenDyslexic2/OpenDyslexic-Regular.otf);
                font-weight: normal;
                font-style: normal;
            }

            filter: ${Filter};
        `}>
            <div class={cls}>
                {children}
            </div>
        </div>
    );
}