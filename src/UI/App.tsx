import { render } from 'preact';
import Router from 'preact-router';
import { createHashHistory } from 'history';
import Main from './pages/main';
import Error from './pages/error';
import Editor from './pages/editor';
import Progress from './pages/progress';
import Settings from './pages/settings';
import { css } from '@emotion/css';
import { getAccessibility, getColor, getFont } from './styles/theme';
import Root from './components/root';

// import Test from './pages/test';

function App() {

    const Font = getFont(),
        Color = getColor(),
        Filter = getAccessibility();
    
    return (
        <Root class={css`
            font-family: ${Font.family};
            font-size: ${Font.size.main};
            filter: ${Filter};

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

            > div {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                padding: 0 15px;
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
