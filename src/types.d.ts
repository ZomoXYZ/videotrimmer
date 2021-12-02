import { FfprobeStream } from "fluent-ffmpeg"

type FFProbe = {
    streams: FFProbeStream[],
    format: FFProbeFormat
}

type FFProbeFormat = {
    filename: string,
    nb_streams: number,
    nb_programs: 0,
    format_name: string,
    format_name_long: string,
    start_time: string,
    duration: string,
    size: string,
    bit_rate: string,
    probe_score: number,
    tags: {
        major_brand: string
        minor_version: string
        compatible_brands: string
        creation_time: string
    }
}

type FFProbeStream = {
    index: number,
    codec_name: string,
    codec_long_name: string,
    profile: string,
    codec_type: string,
    codec_time_base: string,
    codec_tag_string: string,
    codec_tag: string,
    width: number,
    height: number,
    coded_width: number,
    coded_height: number,
    has_b_frames: number,
    pix_fmt: string,
    level: number,
    color_range: string,
    color_space: string,
    color_transfer: string,
    color_primaries: string,
    chroma_location: string,
    refs: number,
    is_avc: string,
    nal_length_size: string,
    r_frame_rate: string,
    avg_frame_rate: string,
    time_base: string,
    start_pts: number,
    start_time: string,
    duration_ts: number,
    duration: string,
    bit_rate: string,
    bits_per_raw_sample: string,
    nb_frames: string,
    disposition: {
        default: number,
        dub: number,
        original: number,
        comment: number,
        lyrics: number,
        karaoke: number,
        forced: number,
        hearing_impaired: number,
        visual_impaired: number,
        clean_effects: number,
        attached_pic: number,
        timed_thumbnails: number
    },
    tags: {
        creation_time: string,
        language: string,
        handler_name: string,
        encoder: string
    }
}

export const EmptyFFProbeStream = (): FFProbeStream => {
    return {
        index: 0,
        codec_name: '',
        codec_long_name: '',
        profile: '',
        codec_type: '',
        codec_time_base: '',
        codec_tag_string: '',
        codec_tag: '',
        width: 0,
        height: 0,
        coded_width: 0,
        coded_height: 0,
        has_b_frames: 0,
        pix_fmt: '',
        level: 0,
        color_range: '',
        color_space: '',
        color_transfer: '',
        color_primaries: '',
        chroma_location: '',
        refs: 0,
        is_avc: '',
        nal_length_size: '',
        r_frame_rate: '',
        avg_frame_rate: '',
        time_base: '',
        start_pts: 0,
        start_time: '',
        duration_ts: 0,
        duration: '',
        bit_rate: '',
        bits_per_raw_sample: '',
        nb_frames: '',
        disposition: {
            default: 0,
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
            timed_thumbnails: 0
        },
        tags: {
            creation_time: '',
            language: '',
            handler_name: '',
            encoder: ''
        }
    }
}

type VideoStream = {
    framerate: number,
    bitrate: number,
    frameCount: number,
    codecLong: string,
    codec: string,
    width: number,
    height: number,
    duration: number
}

type AudioStream = {
    bitrate: number,
    codecLong: string,
    codec: string,
    duration: number
}

type StreamsData = {
    video: VideoStream[],
    audio: AudioStream[],
    subtitles: FFProbeStream[],
    other: FFProbeStream[],
    primary: {
        video: VideoStream,
        audio: AudioStream
    }
}

type FileData = {
    bitrate: number,
    duration: number,
    format: string,
    filename: string,
    streams: StreamsData,
    path: ParsedPath
}

export const EmptyFileData = (): FileData => {
    return {
        bitrate: 0,
        duration: 0,
        format: '',
        filename: '',
        streams: getStreamsData(),
        path: ''
    }
}