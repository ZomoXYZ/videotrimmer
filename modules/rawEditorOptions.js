module.exports = {
    basic: {
        fixmic: {
            parent: null,
            type: "checkbox",
            label: "Fix Mic and Combine Audio",
            visibility: false,
            disabled: false,
            dynamic: {
                visibility: info => info.audio.channels >= 2,
                disabled: info => info.options.onlygame.checked
            },
            run: ffmpeg => ffmpeg.complexFilter([
                        {
                            filter: 'afftdn', options: { nt: 'w', om: 'o', tr: '' },
                            inputs: '[0:a:1]', outputs: 'a'
                        },
                        {
                            filter: 'agate', options: { threshold: '.035' },
                            inputs: 'a', outputs: 'a'
                        },
                        {
                            filter: 'amix', options: { inputs: '2' },
                            inputs: ['[0:a:0]', 'a'], outputs: 'a'
                        }
                    ]).outputOptions('-map', '0:v:0', '-map', '[a]')
        },
        onlygame: {
            parent: null,
            type: "checkbox",
            label: "Only Game Audio",
            visibility: false,
            disabled: false,
            dynamic: {
                visibility: info => info.audio.channels >= 2,
                disabled: info => info.options.fixmic.checked
            },
            run: ffmpeg => ffmpeg.outputOptions('-map', '0:v:0', '-map', '0:a:0')
        },
        tocompress: {
            parent: null,
            type: "checkbox",
            label: "Compress",
            visibility: true,
            disabled: false,
            dynamic: {
                visibility: null,
                disabled: null
            }
        },
        compresssecondfile: {
            parent: "tocompress",
            type: "checkbox",
            label: "as another file",
            visibility: true,
            disabled: true,
            dynamic: {
                visibility: null,
                disabled: info => info.options.tocompress.checked
            }
        },
        compresssecondfile: {
            parent: "tocompress",
            type: "dropdown",
            dropdown: [
                ["auto", "auto"],
                ["discord", "discord auto"],
                ["large", "large"],
                ["medium", "medium"],
                ["small", "small"],
            ],
            label: "File size",
            visibility: true,
            disabled: true,
            dynamic: {
                visibility: null,
                disabled: info => info.options.tocompress.checked
            }
        }
    },
    advance: {

    }
};
