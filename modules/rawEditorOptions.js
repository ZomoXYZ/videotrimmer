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
        normalize: {
            parent: null,
            type: "checkbox",
            label: "Normalize Audio",
            dynamic: {
                visibility: info => info.data.streams.audio.length >= 1,
                enabled: true
            },
            run: (ffmpeg, info) => {
                /*info.getData(ffmpegData => {
                    return ffmpegData.
                })*/

                let ffmpegData = info.rawffmpeg(['-i', info.getInputPath(), '-af', 'volumedetect', '-vn', '-sn', '-dn', '-f', 'null', '/dev/null']);

                let shellout = ffmpegData.stderr.toString().split('\n');
                shellout = shellout.filter(l => l.startsWith('[Parsed_volumedetect'));

                let audioInfo = {};

                shellout.forEach(l => {
                    let lineinfo = l.match(/\[.*?\] (.*$)/)[1].split(/:\s*/);
                    audioInfo[lineinfo[0]] = lineinfo[1];
                });

                if ('max_volume' in audioInfo) {
                    let maxVolume = parseFloat(audioInfo['max_volume']),
                        volumeChange = -0.1 - maxVolume; // -0.1 offset so max isn't at 0dB exactly

                    console.log(`Normalizing Audio (${volumeChange}dB)`)
                    
                    if (volumeChange === 0)
                        return ffmpeg;
                    
                    return ffmpeg.audioFilters(`volume=${volumeChange}dB`);
                    
                }

                return ffmpeg;
            }
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

                let bitrate = 0,
                    constantbr = false;

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

                    bitrate = br*1e3;
                    if (maxbitrate)
                        bitrate = Math.min(bitrate, maxbitrate);
                    bitrate = Math.min(bitrate, info.data.streams.primary.video.bitrate / 1000);

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


                        //convert max MB to KB but with base 1024 instead of 1000
                        max -= .15; //give it a buffer bc it keeps going over by about .12

                        max *= 1048576; //1024*1024
                        max /= 1e3;

                        let duration = parseFloat(info.data.streams.primary.video.duration);

                        let maxbitrate = Math.floor(8 * max / duration); //simplified https://blog.frame.io/2017/03/06/calculate-video-bitrates/

                        constantbr = true;

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

                console.log('bitrate (kbps): ', bitrate);

                if (bitrate > 0)
                    ffmpeg.videoBitrate(Math.floor(bitrate), constantbr);

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
                ["extrasmall", "extra small"]
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
