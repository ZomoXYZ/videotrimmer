import { EmptyFileData, FileData, ParsedPath, Settings } from "../types";
import fs from 'fs';
import path from 'path';
import { getElementById, querySelector } from "./getElem";

const secondsToTime = (seconds: number) => { //1000 (seconds) -> 16:40 (minutes:seconds)
    seconds = Math.floor(seconds);
    seconds = Math.max(0, seconds);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - (minutes * 60);

    let mNum = minutes.toString(),
        sNum = minutes.toString();

    if (minutes < 10) { mNum = "0" + minutes; }
    if (seconds < 10) { sNum = "0" + seconds; }
    return mNum + ':' + sNum;
};

export default function editor(video: HTMLVideoElement, onload: () => void, error: (err: any) => void, settings: Settings) {
    /*
     * video: video html element
     * error: callback function in case of error
     */

    const editorOptions = require('./editorOptions.js')(settings);
    
    //base definitions
    var videoPos = 0,
        trimStartPos = 0,
        trimEndPos = 0,
        videoPositionDragging = false,
        trimStartDragging = false,
        trimEndDragging = false,
        volumeDragging = false,
        savedLeftPosition = 0,
        
        isOpen = false,
        
        videoData: FileData = EmptyFileData(),
        videoSrc: ParsedPath|null = null,
        tmpDir: string|null = null;
    
    //calculate where the positions of each point should be in each bar
    function calculatePositionBar() {
        if (isOpen && !videoPositionDragging && !trimStartDragging && !trimEndDragging && !volumeDragging) {
            
            //console.log(trimStartPos, trimEndPos);
            
            if (video.currentTime >= trimEndPos && !video.paused)
                video.pause();
            
            if (video.currentTime < trimStartPos)
                video.currentTime = trimStartPos;
            else if (video.currentTime > trimEndPos)
                video.currentTime = trimEndPos;
            
            getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
            
            let videoWidth = parseFloat(getComputedStyle(getElementById('videoBar')).width) - 2,
                volumeWidth = parseFloat(getComputedStyle(getElementById('volumeBar')).width);
            
            querySelector('#videoBar .position').style.left = ( video.currentTime/video.duration*videoWidth ).toString();
            querySelector('#videoBar .trimstart').style.left = ( trimStartPos/video.duration*videoWidth ).toString();
            querySelector('#videoBar .trimend').style.left = ( trimEndPos/video.duration*videoWidth ).toString();
            querySelector('#volumeBar .position').style.left = ( video.volume*volumeWidth ).toString();
            
            videoPos = video.currentTime;
        }
    }
    
    //error catching
    video.addEventListener('error', () => {
        error(video.error);
    });
    
    //on video load
    video.addEventListener('progress', () => {
        getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
        getElementById('endTime').textContent = secondsToTime(video.duration);
        trimEndPos = video.duration;
        calculatePositionBar();
        document.body.classList.remove('processing');
        document.body.classList.add('editor');
        onload();
    });
    
    //general video listeners
    video.addEventListener('timeupdate', calculatePositionBar);
    video.addEventListener('volumechange', calculatePositionBar);
    video.addEventListener('click', () => {
        if (video.paused)
            video.play();
        else
            video.pause();
    });
    
    //recalculate positions of points in bars on window resize
    addEventListener('resize', calculatePositionBar);
    
    //begin dragging points
    querySelector('#videoBar .position').addEventListener('mousedown', () => {
        videoPositionDragging = true;
        savedLeftPosition = parseInt(querySelector('#videoBar .position').style.left);
        video.pause();
    });
    querySelector('#videoBar .trimstart').addEventListener('mousedown', () => {
        trimStartDragging = true;
        savedLeftPosition = parseInt(querySelector('#videoBar .position').style.left);
        video.pause();
    });
    querySelector('#videoBar .trimend').addEventListener('mousedown', () => {
        trimEndDragging = true;
        savedLeftPosition = parseInt(querySelector('#videoBar .position').style.left);
        video.pause();
    });
    querySelector('#volumeBar .position').addEventListener('mousedown', () => {
        volumeDragging = true;
    });
    
    //continue dragging points
    document.addEventListener('mousemove', e => {
        let videoBar = getElementById('videoBar').getBoundingClientRect(),
            left = e.clientX - videoBar.left;

        if (left < 0)
            left = 0;
        else if (left > videoBar.width)
            left = videoBar.width;
        
        if (videoPositionDragging) {
            
            if (left < querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            else if (left > querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(getElementById('videoBar')).width);
            
            querySelector('#videoBar .position').style.left = leftVisible.toString();
            
            video.currentTime = videoPos = percent*video.duration;
            getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
        } else if (trimStartDragging) {
            
            if (left > querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(getElementById('videoBar')).width);
            
            querySelector('#videoBar .trimstart').style.left = leftVisible.toString();
            
            video.currentTime = trimStartPos = percent*video.duration;
            getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimStartPos >= videoPos)
                querySelector('#videoBar .position').style.left = leftVisible.toString();
            else
                querySelector('#videoBar .position').style.left = savedLeftPosition.toString();
            
        } else if (trimEndDragging) {
            
            if (left < querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(getElementById('videoBar')).width);
            
            querySelector('#videoBar .trimend').style.left = leftVisible.toString();
            
            video.currentTime = trimEndPos = percent*video.duration;
            getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimEndPos <= videoPos)
                querySelector('#videoBar .position').style.left = leftVisible.toString();
            else
                querySelector('#videoBar .position').style.left = savedLeftPosition.toString();
            
        } else if (volumeDragging) {
            
            let volumeBar = getElementById('volumeBar').getBoundingClientRect();
            left = e.clientX - volumeBar.left;

            if (left < 0)
                left = 0;
            else if (left > volumeBar.width)
                left = volumeBar.width;
            
            let percent = left/volumeBar.width,
                leftVisible = percent*parseFloat(getComputedStyle(getElementById('volumeBar')).width);
            
            querySelector('#volumeBar .position').style.left = leftVisible.toString();
            
            video.volume = percent;
            
        }
        
    });
    
    //end dragging points
    document.addEventListener('mouseup', () => {
        videoPositionDragging = false;
        if (trimStartDragging || trimEndDragging) {
            video.currentTime = videoPos;
            getElementById('currentTime').textContent = secondsToTime(Math.floor(videoPos));
        }
        trimStartDragging = false;
        trimEndDragging = false;
        volumeDragging = false;
    });
    
    //keyboard shortcuts
    const keysHolding: { [keys: string]: () => void } = {
        ArrowLeft: () => {
            video.pause();
            video.currentTime = videoPos = Math.max(trimStartPos, video.currentTime - (1/videoData.streams.primary.video.framerate));
        },
        ArrowRight: () => {
            video.pause();
            video.currentTime = videoPos = Math.min(trimEndPos, video.currentTime + (1/videoData.streams.primary.video.framerate));
        },
        ArrowUp: () => {
            video.volume = Math.min(1, video.volume + .05);
            console.log(video.volume);
            calculatePositionBar();
        },
        ArrowDown: () => {
            video.volume = Math.max(0, video.volume - .05);
            console.log(video.volume);
            calculatePositionBar();
        },
        ' ': () => {
            if (video.paused && videoPos < trimEndPos)
                video.play();
            else
                video.pause();
        },
        '[': () => {
            trimStartPos = video.currentTime;
            getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
        },
        ']': () => {
            trimEndPos = video.currentTime;
            getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
            video.pause();
        }
    };
    document.addEventListener('keydown', e => {
        if (isOpen && e.key in keysHolding) {
            e.preventDefault();
            keysHolding[e.key]();
        }
    });

    //generate temp directory
    function genTempDir(videoDir: ParsedPath): string {

        let tempdir = path.join(videoDir.dir, videoDir.name + '.tmp/');

        if (!fs.existsSync(tempdir))
            fs.mkdirSync(tempdir);

        if (!fs.lstatSync(tempdir).isDirectory())
            throw `File ${tempdir} exists and is not a directory`;

        return tempdir;
    }
    
    //interact with index.js
    return {
        open() {
            
            videoPos = 0;
            trimStartPos = 0;
            trimEndPos = 0;
            videoPositionDragging = false;
            trimStartDragging = false;
            trimEndDragging = false;
            volumeDragging = false;
            savedLeftPosition = 0;
            
            isOpen = true;
            
        },
        src(data: FileData) {
            if (!videoSrc)
                tmpDir = genTempDir(data.path);

            videoSrc = data.path;
            video.setAttribute('src', path.format(data.path));
            editorOptions.generate(data);
            videoData = data;
        },
        finish(runFFMPEG: (total: number) => ((args: string[]) => Promise<null>), ffDirs: [path.ParsedPath, path.ParsedPath, path.ParsedPath]) {
            video.pause();
            isOpen = false;
            editorOptions.finish(videoSrc, tmpDir, runFFMPEG, ffDirs, trimEndPos - trimStartPos);
        },
        data() {
            return { trimStartPos, trimEndPos, duration: trimEndPos-trimStartPos };
        },
        onload(func: () => void) {
            onload = func;
        },
        
    };
    
};