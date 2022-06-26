// TODO fix this error, if i uncomment nativeTheme then electron throws an error
// likely caused by esbuild trying to compile electron

// import { remote } from 'electron';
// const { nativeTheme } = remote;
interface ThemeColor {
    background: string;
    text: string;
    button: {
        background: string;
        backgroundHover: string;
        backgroundActive: string;
        border: string;
    };
    checkbox: {
        background: string;
        shadowHover: string;
        shadowActive: string;
        disabled: string;
    };
    dropdown: {
        background: string;
        shadowHover: string;
        disabled: string;
    };
}

interface ThemeFont {
    family: string;
    size: {
        main: string;
        version: string;
    };
}

interface Themes {
    color: { [id: string]: ThemeColor };
    font: { [id: string]: ThemeFont };
    accessibility: { [id: string]: string };
}

const Theme: Themes = {
    color: {
        dark: {
            background: '#434442',
            text: '#ddd',
            button: {
                background: '#666',
                backgroundHover: '#888',
                backgroundActive: '#777',
                border: '#888',
            },
            checkbox: {
                background: '#ddd',
                shadowHover: '#666',
                shadowActive: '#666',
                disabled: '#666',
            },
            dropdown: {
                background: '#ddd',
                shadowHover: '#777',
                disabled: '#777',
            },
        },
        light: {
            background: '#fff',
            text: '#000',
            button: {
                background: '#ddd',
                backgroundHover: '#bbb',
                backgroundActive: '#ccc',
                border: '#eee',
            },
            checkbox: {
                background: '#bbb',
                shadowHover: '#bbb',
                shadowActive: '#ccc',
                disabled: '#bbb',
            },
            dropdown: {
                background: '#bbb',
                shadowHover: '#ccc',
                disabled: '#ccc',
            },
        },
    },
    font: {
        default: {
            family: 'OpenSans',
            size: {
                main: '24px',
                version: '12px',
            },
        },
        dyslexic: {
            family: 'OpenDyslexic',
            size: {
                main: '20px',
                version: '12px',
            },
        },
    },
    accessibility: {
        contrast: 'contrast(1.5)',
        invert: 'invert(1)',
    },
};

function getColor(): ThemeColor {
    // const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    // return Theme.color[theme];
    return Theme.color['dark'];
}

function getFont(): ThemeFont {
    return Theme.font.default;
}

//composite all accessibility styles together (separated by space) to be passed to the filter
function getAccessibility(): string {
    const filter: string[] = [];

    // if (nativeTheme.shouldUseHighContrastColors)
    //     filter.push(Theme.accessibility.contrast);

    // if (nativeTheme.shouldUseInvertedColorScheme)
    //     filter.push(Theme.accessibility.invert);

    return filter.join(' ');
}

export { getColor, getFont, getAccessibility };
