type ThemeColor = {
    background: string,
    text: string,
    button: {
        background: string,
        backgroundHover: string,
        backgroundActive: string,
        border: string
    }
}

type Themes = {
    color: {[id: string]: ThemeColor},
    font: {[id: string]: string},
    accessibility: {[id: string]: string}
};

export default {
    color: {
        light: {
            background: '#fff',
            text: '#000',
            button: {
                background: '#ddd',
                backgroundHover: '#bbb',
                backgroundActive: '#ccc',
                border: '#eee'
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
} as Themes