interface ThemeColor {
    background: string,
    text: string,
    button: {
        background: string,
        backgroundHover: string,
        backgroundActive: string,
        border: string
    },
    checkbox: {
        background: string,
        shadowHover: string,
        shadowActive: string,
        disabled: string
    },
    dropdown: {
        background: string,
        shadowHover: string,
        disabled: string
    }
}

type Themes = {
    color: {[id: string]: ThemeColor},
    font: {[id: string]: string},
    accessibility: {[id: string]: string}
};

const Theme: Themes = {
    color: {
        dark: {
            background: '#434442',
            text: '#ddd',
            button: {
                background: '#666',
                backgroundHover: '#888',
                backgroundActive: '#777',
                border: '#555'
            },
            checkbox: {
                background: '#ddd',
                shadowHover: '#666',
                shadowActive: '#666',
                disabled: '#666'
            },
            dropdown: {
                background: '#ddd',
                shadowHover: '#777',
                disabled: '#777'
            }
        },
        light: {
            background: '#fff',
            text: '#000',
            button: {
                background: '#ddd',
                backgroundHover: '#bbb',
                backgroundActive: '#ccc',
                border: '#eee'
            },
            checkbox: {
                background: '#bbb',
                shadowHover: '#bbb',
                shadowActive: '#ccc',
                disabled: '#bbb'
            },
            dropdown: {
                background: '#bbb',
                shadowHover: '#ccc',
                disabled: '#ccc'
            }
        }
    },
    font: {
        default: 'OpenSans',
        dyslexic: 'OpenDyslexic'
    },
    accessibility: {
        contrast: 'contrast(1.5)',
        invert: 'invert(1)',
    }
};

function getColor() {
    return Theme.color['dark'];
}

function getFont() {
    return Theme.font.default;
}

//composite all accessibility styles together (separated by space) to be passed to the filter
function getAccessibility() {
    return '';
}

export {
    getColor,
    getFont,
    getAccessibility
};