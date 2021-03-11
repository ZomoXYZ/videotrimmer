module.exports = {
    basic: {
        fixmic: {
            parent: null,
            type: "checkbox",
            label: "Fix Mic and Combine Audio",
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
            dynamic: {
                visibility: true,
                enabled: true
            },
            run: (ffmpeg, info) => {

                if (info.options.basic.compresssecondfile) {
                    let fname = info.getOutput();
                    fname.name = fname.name + '_compressed';
                    fname.base = fname.name + fname.ext;
                    ffmpeg = info.newCommand(fname, ffmpeg);
                }

                let bitrate = 0;

                const getAuto = maxbitrate => {
                    let size = Math.min(info.data.streams.primary.video.width, info.data.streams.primary.video.height);
                    
                    let br = 0;

                    console.log(size, info.data.streams.primary.video.framerate)

                    //https://support.google.com/youtube/answer/1722171#zippy=%2Cbitrate
                    if (info.data.streams.primary.video.framerate <= 30) {
                        if (size <= 360)
                            br = 1;
                        else if (size <= 480)
                            br = 2.5;
                        else if (size <= 720)
                            br = 5;
                        else if (size <= 1080)
                            br = 8;
                        else if (size <= 1440)
                            br = 16;
                        else 
                            br = 35;
                    } else {
                        if (size <= 360)
                            br = 1.5;
                        else if (size <= 480)
                            br = 4;
                        else if (size <= 720)
                            br = 7.5;
                        else if (size <= 1080)
                            br = 12;
                        else if (size <= 1440)
                            br = 24;
                        else
                            br = 55
                    }

                    bitrate = Math.min(br*1e3, maxbitrate);

                };

                switch (info.options.basic.compresstype) {
                    case 'auto':
                        getAuto();
                        break;
                    case 'discord':
                        let max = 8;
                        if (info.options.basic.discordtypeclassic)
                            max = 50;
                        else if (info.options.basic.discordtypenitro)
                            max = 100;

                        let duration = parseFloat(info.data.streams.primary.video.duration);

                        let maxbitrate = 8e6 * max / duration; //simplified https://blog.frame.io/2017/03/06/calculate-video-bitrates/

                        getAuto(maxbitrate);
                        
                        break;
                    case 'large':
                        bitrate = 12e3;
                        break;
                    case 'medium':
                        bitrate = 8e3;
                        break;
                    case 'small':
                        bitrate = 4e3;
                        break;
                    case 'extrasmall':
                        bitrate = 2e3;
                        break;
                }

                if (bitrate > 0)
                    ffmpeg.videoBitrate(Math.floor(bitrate) + 'k');

                return ffmpeg;
            }
        },
        compresssecondfile: {
            parent: "tocompress",//parent must be of same type, so type option is unnecessary
            small: true,
            label: "as another file",
            dynamic: {
                visibility: true,
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
                ["extrasmall", "extrasmall"]
            ],
            value: "discord",
            label: "File size",
            dynamic: {
                visibility: true,
                enabled: info => info.options.basic.tocompress
            },
            run: null
        },
        discordtypenitro: {
            parent: null,
            type: "checkbox",
            small: true,
            label: "Nitro",
            dynamic: {
                visibility: info => info.options.basic.tocompress && info.options.basic.compresstype === 'discord',
                enabled: info => !info.options.basic.discordtypeclassic
            },
            run: null
        },
        discordtypeclassic: {
            parent: "discordtypenitro",
            small: true,
            label: "Nitro Classic",
            dynamic: {
                visibility: info => info.options.basic.tocompress && info.options.basic.compresstype === 'discord',
                enabled: info => !info.options.basic.discordtypenitro
            },
            run: null
        }
    },
    advance: {

    }
};
