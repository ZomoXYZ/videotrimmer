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
    }
}

type Themes = {
    color: {[id: string]: ThemeColor},
    font: {[id: string]: string},
    accessibility: {[id: string]: string}
};

const Theme: Themes = {
    color: {
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
            }
        },
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

export default Theme;