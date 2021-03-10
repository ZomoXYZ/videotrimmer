module.exports = {
    basic: {
        fixmic: {
            parent: null,
            type: "checkbox",
            label: "Fix Mic and Combine Audio",
            visibility: false,
            enabled: true,
            dynamic: {
                visibility: info => info.data.streams.audio.length >= 2,
                enabled: info => !info.options.basic.onlygame
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
            enabled: true,
            dynamic: {
                visibility: info => info.data.streams.audio.length >= 2,
                enabled: info => !info.options.basic.fixmic
            },
            run: ffmpeg => ffmpeg.outputOptions('-map', '0:v:0', '-map', '0:a:0')
        },
        tocompress: {
            parent: null,
            type: "checkbox",
            label: "Compress",
            visibility: true,
            enabled: true,
            dynamic: {
                visibility: null,
                enabled: null
            },
            run: (ffmpeg, info) => {
                if (info.options.basic.compresssecondfile) {
                    //do as second file
                } else {
                    //do as single file
                }
                info.options.basic.compressType // compression type
            }
        },
        compresssecondfile: {
            parent: "tocompress",//parent must be of same type, so type option is unnecessary
            label: "as another file",
            visibility: true,
            enabled: false,
            dynamic: {
                visibility: null,
                enabled: info => info.options.basic.tocompress
            },
            run: null
        },
        compresstype: {
            parent: null,
            type: "dropdown",
            dropdown: [
                ["auto", "auto"],
                ["discord", "discord auto"],
                ["large", "large"],
                ["medium", "medium"],
                ["small", "small"],
            ],
            value: "discord",
            label: "File size",
            visibility: true,
            enabled: false,
            dynamic: {
                visibility: null,
                enabled: info => info.options.basic.tocompress
            },
            run: null
        }
    },
    advance: {

    }
};
