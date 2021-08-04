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
                    ]).outputOptions('-map', '0:v:0', '-map', '[a]').videoCodec('copy')
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
                    
                    return ffmpeg.audioFilters(`volume=${volumeChange}dB`);;
                    
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

                let bitrate = 0,
                    videobitrate = 0,
                    audiobitrate = 128,
                    constantbr = false,
                    usedMaxbitrate = false;

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
                    if (maxbitrate) {
                        if (bitrate > maxbitrate)
                            usedMaxbitrate = true;
                        bitrate = Math.min(bitrate, maxbitrate);
                    }
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

                        max *= 1.024; //kibibyte to kilobyte

                        max *= .95; //95% of max, giving a buffer
                        // ^ make this buffer changable under advanced options
                        max *= 1e3;

                        let maxbitrate = Math.floor(8 * max / info.duration); //simplified https://blog.frame.io/2017/03/06/calculate-video-bitrates/

                        constantbr = true;

                        getAuto(maxbitrate);
                        
                        break;
                    case 'large':
                        bitrate = 12e3;
                        break;
                    case 'medium':
                        bitrate = 8e3;
                        audiobitrate = 64;
                        break;
                    case 'small':
                        bitrate = 4e3;
                        audiobitrate = 64;
                        break;
                    case 'extrasmall':
                        bitrate = 2e3;
                        audiobitrate = 64;
                        break;
                }

                ffmpeg.outputOptions('-map', '0:v:0', '-map', '0:a:0');

                videobitrate = bitrate;

                if (usedMaxbitrate)
                    videobitrate = bitrate - audiobitrate;

                console.log(`duration: ${info.duration}s
total bitrate: ${bitrate}Kbps
video bitrate: ${videobitrate}Kbps
audio bitrate: ${audiobitrate}Kbps`);

                if (videobitrate > 0)
                    ffmpeg.videoBitrate(Math.floor(videobitrate), constantbr);
                if (audiobitrate > 0)
                    ffmpeg.audioBitrate(Math.floor(audiobitrate), constantbr);

                if (info.options.basic.compresssecondfile) {
                    info.asNewFile('_compressed');
                    return ffmpeg;
                }
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
            default: info => info.settings.discordnitro === 1,
            on: (target, info) => info.settings.discordnitro = target.checked ? 1 : 0,
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
            default: info => info.settings.discordnitro === 2,
            on: (target, info) => info.settings.discordnitro = target.checked ? 2 : 0,
            small: true,
            label: "Nitro Classic",
            dynamic: {
                visibility: info => info.options.basic.tocompress && info.options.basic.compresstype === 'discord',
                enabled: info => !info.options.basic.discordtypenitro
            },
            run: null
        }
    },
    advance: { // not yet implemented, this is just the idea for later
        autodiscordbuffer: {
            parent: null,
            type: "number",
            input: {
                default: 5,
                min: 0,
                max: 1,
                step: 0.01
            },
            label: "Discord Auto Buffer",
            dynamic: {
                visibility: info => info.options.basic.tocompress && info.options.basic.compresstype === 'discord',
                enabled: true
            },
            run: null
        }
    }
};
