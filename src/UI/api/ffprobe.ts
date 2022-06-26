import {
    FFProbeAudioStream,
    FFProbeData,
    FFProbeStreams,
    FFProbeStreamsNoPrimary,
    FFProbeVideoStream,
} from '../types/ffprobe';
import { ElectronFile } from '../types/electron';
import { useEffect, useState } from 'react';

export function useFFProbe(file: ElectronFile) {
    const [data, setData] = useState<FFProbeData | null>(null);

    useEffect(() => {
        //TODO use electron ipc
        const FFProbeExample = {
            streams: [
                {
                    index: 0,
                    codec_name: 'h264',
                    codec_long_name:
                        'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
                    profile: 'High',
                    codec_type: 'video',
                    codec_time_base: '1/60',
                    codec_tag_string: 'avc1',
                    codec_tag: '0x31637661',
                    width: 720,
                    height: 1280,
                    coded_width: 720,
                    coded_height: 1280,
                    has_b_frames: 2,
                    pix_fmt: 'yuv420p',
                    level: 31,
                    chroma_location: 'left',
                    refs: 1,
                    is_avc: 'true',
                    nal_length_size: '4',
                    r_frame_rate: '30/1',
                    avg_frame_rate: '30/1',
                    time_base: '1/15360',
                    start_pts: 0,
                    start_time: '0.000000',
                    duration_ts: 232448,
                    duration: '15.133333',
                    bit_rate: '52011',
                    bits_per_raw_sample: '8',
                    nb_frames: '454',
                    disposition: {
                        default: 1,
                        dub: 0,
                        original: 0,
                        comment: 0,
                        lyrics: 0,
                        karaoke: 0,
                        forced: 0,
                        hearing_impaired: 0,
                        visual_impaired: 0,
                        clean_effects: 0,
                        attached_pic: 0,
                        timed_thumbnails: 0,
                    },
                    tags: {
                        language: 'und',
                        handler_name: 'VideoHandler',
                    },
                },
                {
                    index: 1,
                    codec_name: 'aac',
                    codec_long_name: 'AAC (Advanced Audio Coding)',
                    profile: 'LC',
                    codec_type: 'audio',
                    codec_time_base: '1/44100',
                    codec_tag_string: 'mp4a',
                    codec_tag: '0x6134706d',
                    sample_fmt: 'fltp',
                    sample_rate: '44100',
                    channels: 2,
                    channel_layout: 'stereo',
                    bits_per_sample: 0,
                    r_frame_rate: '0/0',
                    avg_frame_rate: '0/0',
                    time_base: '1/44100',
                    start_pts: 0,
                    start_time: '0.000000',
                    duration_ts: 667630,
                    duration: '15.139002',
                    bit_rate: '125645',
                    max_bit_rate: '128000',
                    nb_frames: '653',
                    disposition: {
                        default: 1,
                        dub: 0,
                        original: 0,
                        comment: 0,
                        lyrics: 0,
                        karaoke: 0,
                        forced: 0,
                        hearing_impaired: 0,
                        visual_impaired: 0,
                        clean_effects: 0,
                        attached_pic: 0,
                        timed_thumbnails: 0,
                    },
                    tags: {
                        language: 'und',
                        handler_name: 'SoundHandler',
                    },
                },
            ],
            format: {
                filename: 'gmod taunt tiktok tts2.mp4',
                nb_streams: 2,
                nb_programs: 0,
                format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
                format_long_name: 'QuickTime / MOV',
                start_time: '0.000000',
                duration: '15.163000',
                size: '354711',
                bit_rate: '187145',
                probe_score: 100,
                tags: {
                    major_brand: 'isom',
                    minor_version: '512',
                    compatible_brands: 'isomiso2avc1mp41',
                    encoder: 'Lavf58.29.100',
                    copyright: 'f6d390e2f883b52c024e79ac67cf9797',
                    description:
                        '[{"creationDate":"2022-06-15T16:27:08-0500","location":"","make":"Android","videoIndex":1,"userSystem":"12","appRecord":"1","MD5":"","videoDevice":"","system":"12","userDevice":"SM-N986U1","deviceResolution":[],"importPath":"","videoResolution":{"width":720,"height":1280},"videoDuration":15029,"isRecord":1,"isCropped":0}]',
                },
            },
        };
        setTimeout(() => {
            setData(parseFFProbe(file, FFProbeExample));
        }, 1000);
    }, []);

    return data;
}

function parseFFProbe(_file: ElectronFile, rawdata: any): FFProbeData {
    return {
        bitrate: parseInt(rawdata.format.bit_rate),
        duration: parseFloat(rawdata.format.duration),
        format: rawdata.format.format_long_name,
        filename: rawdata.format.filename,
        streams: getStreamsData(rawdata.streams),
        // path: parse(file.path), TODO use parse()
        path: {
            dir: '/example/path/to',
            base: 'test.mp4',
            ext: '.mp4',
            name: 'test',
            root: '/',
        },
    };
}

function getStreamsData(streams: any[] = []) {
    let ret: FFProbeStreamsNoPrimary = {
        video: [],
        audio: [],
        subtitles: [],
        other: [],
    };

    const CodecTypes = ['video', 'audio', 'subtitles'];

    streams.forEach((stream: any) => {
        let codecType: keyof FFProbeStreamsNoPrimary = CodecTypes.includes(
            stream.codec_type
        )
            ? stream.codec_type
            : 'other';
        ret[codecType].push(getStreamData(codecType, stream));
    });

    let retPrimary: FFProbeStreams = {
        ...ret,
        primary: {
            video: ret.video[0],
            audio: ret.audio[0],
        },
    };

    return retPrimary;
}

type StreamDataVal<T> = T extends 'video'
    ? FFProbeVideoStream
    : T extends 'audio'
    ? FFProbeAudioStream
    : any;

//function to create an objecy of video data
function getStreamData<T extends keyof FFProbeStreamsNoPrimary>(
    type: T,
    stream: any
): StreamDataVal<T> {
    switch (type) {
        case 'video':
            return {
                framerate: eval(stream.avg_frame_rate),
                bitrate: parseInt(stream.bit_rate),
                frameCount: parseInt(stream.nb_frames),
                codecLong: stream.codec_long_name,
                codec: stream.codec_name,
                width: stream.width,
                height: stream.height,
                aspectRatio: stream.display_aspect_ratio,
                duration: stream.duration,
            } as StreamDataVal<T>;
        case 'audio':
            return {
                bitrate: parseInt(stream.bit_rate),
                codecLong: stream.codec_long_name,
                codec: stream.codec_name,
                duration: stream.duration,
            } as StreamDataVal<T>;
        case 'subtitles':
        case 'other':
            return stream;
    }
    return stream;
}
