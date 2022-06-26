import { HashRouter, Route, Routes } from "react-router-dom";
import styled from "@emotion/styled";
import Main from "./pages/main";
import Error from "./pages/error";
import Editor from "./pages/editor";
import Progress from "./pages/progress";
import Settings from "./pages/settings";
import { getAccessibility, getColor, getFont } from "./styles/theme";
import "./styles/fonts.css";
import { css } from "@emotion/css";

export default function () {
    const Font = getFont(),
        Color = getColor(),
        Filter = getAccessibility();

    document.body.classList.add(css`
        background: ${Color.background};
    `)

    const AppContainer = styled.div`
        background: ${Color.background};
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
    `;

    return (
        <AppContainer>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/error" element={<Error />} />
                    <Route path="/editor" element={<Editor />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </HashRouter>
        </AppContainer>
    );
}
