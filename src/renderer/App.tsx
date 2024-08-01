import styled from '@emotion/styled'
import { getAccessibility, getColor, getFont } from './styles/theme'
import './styles/fonts.css'
import { css } from '@emotion/css'
import Main from './pages/main'

export default function App() {
    const Font = getFont()
    const Color = getColor()
    const Filter = getAccessibility()

    document.body.classList.add(css`
        background: ${Color.background};
        margin: 0;
    `)

    const AppContainer = styled.div`
        background: ${Color.background};
        font-family: ${Font.family};
        font-size: ${Font.size.main};
        filter: ${Filter};

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
    `

    return (
        <AppContainer>
            <Main />
        </AppContainer>
    )
}
