import { render } from 'preact';
import Router from 'preact-router';
import { createHashHistory } from 'history';
import Main from './pages/main';
import Error from './pages/error';
import Editor from './pages/editor';
import Progress from './pages/progress';
import Settings from './pages/settings';
import { css } from '@emotion/css';
import { getColor, getFont } from './styles/theme';
import Root from './components/root';

// import Test from './pages/test';

function App() {

    const Font = getFont(),
        Color = getColor();
    
    return (
        <Root globalStyle={css`
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-Bold.ttf);
                font-weight: bold;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-BoldItalic.ttf);
                font-weight: bold;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-ExtraBold.ttf);
                font-weight: bolder;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-ExtraBoldItalic.ttf);
                font-weight: bolder;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-Italic.ttf);
                font-weight: normal;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-Light.ttf);
                font-weight: lighter;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-LightItalic.ttf);
                font-weight: lighter;
                font-style: italic;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-Regular.ttf);
                font-weight: normal;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-SemiBold.ttf);
                font-weight: 600;
                font-style: normal;
            }
            @font-face {
                font-family: OpenSans;
                src: url(./resources/Open_Sans/OpenSans-SemiBoldItalic.ttf);
                font-weight: 600;
                font-style: italic;
            }

            @font-face {
                font-family: OpenDyslexic;
                src: url(./resources/OpenDyslexic2/OpenDyslexic-Bold.otf);
                font-weight: bold;
                font-style: normal;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(./resources/OpenDyslexic2/OpenDyslexic-BoldItalic.otf);
                font-weight: bold;
                font-style: italic;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(./resources/OpenDyslexic2/OpenDyslexic-Italic.otf);
                font-weight: normal;
                font-style: italic;
            }
            @font-face {
                font-family: OpenDyslexic;
                src: url(./resources/OpenDyslexic2/OpenDyslexic-Regular.otf);
                font-weight: normal;
                font-style: normal;
            }
        `}
        class={css`
            font-family: ${Font.family};
            font-size: ${Font.size.main};
            font-smoothing: antialiased;

            margin: 0;
            width: 100%;
            height: 100%;
            box-sizing: inherit;

            overflow: hidden;
            cursor: default;

            color: ${Color.text};

            transition: color 200ms ease-in-out;

            *::before,
            *::after {
                box-sizing: inherit;
            }
        `}>

            {/* https://github.com/preactjs/preact-router/issues/423
            the typemismatch is a lie apparently
            @ts-ignore */}
            <Router history={createHashHistory()}>
                <Main path="/" />
                <Error path="/error" />
                <Editor path="/editor" />
                <Progress path="/progress" />
                <Settings path="/settings" />
            </Router>
            {/* <Test /> */}

        </Root>
    );
    
}

render(<App />, document.body);
