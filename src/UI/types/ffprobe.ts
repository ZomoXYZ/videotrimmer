import { ParsedPath } from 'path';

export interface FFProbeData {
    bitrate: number;
    duration: number;
    format: string;
    filename: string;
    streams: FFProbeStreams;
    path: ParsedPath;
}

export interface FFProbeStreamsNoPrimary {
    video: FFProbeVideoStream[];
    audio: any[];
    subtitles: any[];
    other: any[];
}

export interface FFProbeStreams extends FFProbeStreamsNoPrimary {
    primary: {
        video: FFProbeVideoStream;
        audio: any;
    };
}

export interface FFProbeVideoStream {
    framerate: number;
    bitrate: number;
    frameCount: number;
    codecLong: string;
    codec: string;
    width: number;
    height: number;
    aspectRatio: string;
    duration: number;
}

/*
{
    bitrate: parseInt(stream.bit_rate),
    codecLong: stream.codec_long_name,
    codec: stream.codec_name,
    duration: stream.duration,
}
*/
export interface FFProbeAudioStream {
    bitrate: number;
    codecLong: string;
    codec: string;
    duration: number;
}
