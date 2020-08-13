const {ipcRenderer, webFrame} = require('electron'),
      mime = require('mime'),
      getMimeType = str => mime.getType(str) || '',
      os = require('os'),
      fs = require('fs'),
      path = require('path'),
      shell = require('child_process'),
      
      secondsToTime = seconds => {
          seconds = Math.floor(seconds);
          seconds = Math.max(0, seconds);
          var minutes = Math.floor(seconds / 60);
          seconds = seconds - (minutes * 60);

          if (minutes < 10) {minutes = "0"+minutes;}
          if (seconds < 10) {seconds = "0"+seconds;}
          return minutes+':'+seconds;
      },

      
      //ffmpeg binaries https://ffbinaries.com/downloads
      ffDir = path.join(getAppDataPath(), 'ffmpeg-binaries'),
      ffmpegDir = path.join(ffDir, 'ffmpeg'),
      ffprobeDir = path.join(ffDir, 'ffprobe');

function getAppDataPath() {
     switch (process.platform) {
        case 'darwin': {
            return path.join(process.env.HOME, 'Library', 'Application Support', 'Ashley-VideoTrimmer');
        }
         case 'win32': {
             return path.join(process.env.APPDATA, 'Ashley-VideoTrimmer');
         }
         case 'linux': {
             return path.join(process.env.HOME, '.Ashley-VideoTrimmer');
         }
         default: {
             console.log('Unsupported platform!');
             process.exit(1);
         }
     }
}

webFrame.setVisualZoomLevelLimits(1, 1);

if (!fs.existsSync(ffDir))
    ipcRenderer.send('exit', 'OS IS NOT SET UP');

addEventListener('load', () => {
    
    document.querySelector('#error .small').addEventListener('click', () => {
        ipcRenderer.send('devtools');
    });
    
    var videoPos = 0,
        trimStartPos = 0,
        trimEndPos = 0,
        videoPositionDragging = false,
        trimStartDragging = false,
        trimEndDragging = false,
        volumeDragging = false,
        savedLeftPosition = 0;
    
    var blockFile = false;
    
    let draggedover = false;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, e => {e.preventDefault();e.stopPropagation();}, false); //prevent defualt
    });
    document.addEventListener('dragover', e => {
        if (!blockFile) {
            document.body.classList.add('hoveringVideo');
            draggedover = true;
        }
    });
    document.addEventListener('dragleave', e => {
        draggedover = false;
        setTimeout(() => {
            if (!draggedover)
                document.body.classList.remove('hoveringVideo');
        }, 10);
    });
    document.addEventListener('drop', e => {
        if (!blockFile) {
            draggedover = false;
            document.body.classList.remove('hoveringVideo');
        }
    });
    document.addEventListener('drop', e => {
        if (!blockFile)
            handleFiles(e.dataTransfer.files);
    }, false);
    document.getElementById('fileupload').addEventListener('change', function() {
        if (!blockFile)
            handleFiles(this.files);
    }, false);

    function handleFiles(files) {
        document.body.setAttribute('class', 'processing');
        
        videoPos = 0;
        trimStartPos = 0;
        trimEndPos = 0;
        videoPositionDragging = false;
        trimStartDragging = false;
        trimEndDragging = false;
        volumeDragging = false;
        savedLeftPosition = 0;
        
        document.querySelector('#progress .progressbar').classList.remove('finished');

        console.log(files);
        //files[i].path
        files = Array.from(files).filter(f => getMimeType(f.path).split('/')[0] === 'video');
        
        if (files.length)
            processVideo(files[0]);
        else
            document.body.removeAttribute('class');
    }
    
    function processVideo(file) {
        
        //ffprobe time
        let probe = shell.spawn(ffprobeDir, ['-v', 'error', '-show_format', '-show_streams', '-print_format', 'json', file.path]),
            output = '';
        probe.stdout.on('data', stdout => {
            output+= stdout;
        });

        probe.stderr.on('data', stderr => {
            console.error(`stderr: ${stderr}`);
            document.body.classList.remove('processing');
            document.body.classList.add('error');
        });

        probe.on('close', code => {
            console.log(`child process exited with code ${code}`);
            output = JSON.parse(output);
            console.log(output);
            
            displayEditor(file, output);
        });
        
    }
    
    function getStreamsData(streams=[]) {
        let ret = {
            video: [],
            audio: [],
            subtitles: [],
            other: [],
            primary: {
                video: getStreamData(false, 'video'),
                audio: getStreamData(false, 'audio')
            }
        };
        
        for (let i = 0; i < streams.length; i++) {
            let codecType = !['video', 'audio', 'subtitles'].includes(streams[i].codec_type) ? 'other' : streams[i].codec_type;
            ret[codecType].push(getStreamData(streams[i], codecType));
        }
        
        if (ret.video.length)
            ret.primary.video = ret.video[0];
        if (ret.audio.length)
            ret.primary.audio = ret.audio[0];
        
        return ret;
    }
    function getStreamData(stream={
        avg_frame_rate: '0',
        bit_rate: '0',
        codec_long_name: '',
        codec_name: '',
        width: 0,
        height: 0,
        display_aspect_ratio: '',
        duration: 0
    }, type) {
        switch(type) {
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
                    duration: stream.duration
                };
            case 'audio':
                return {
                    bitrate: parseInt(stream.bit_rate),
                    codecLong: stream.codec_long_name,
                    codec: stream.codec_name,
                    duration: stream.duration
                };
            case 'subtitles':
            case 'other':
                return stream;
        }
    }
    
    const video = document.querySelector('#editor video');
    var data = {
        bitrate: 0,
        duration: 0,
        format: '',
        filename: '',
        streams: getStreamsData(),
        path: ''
    };
    function displayEditor(file, rawdata) {
        
        data = {
            bitrate: rawdata.format.bit_rate,
            duration: rawdata.format.duration,
            format: rawdata.format.format_long_name,
            filename: rawdata.format.filename,
            streams: getStreamsData(rawdata.streams),
            path: path.parse(file.path)
        };
        
        console.log(data);
            
        document.querySelectorAll('#quickoptions input').forEach(input => {
            if (input.hasAttribute('a:channels') && parseInt(input.getAttribute('a:channels')) !== data.streams.audio.length)
                input.parentElement.parentElement.classList.add('disabled');
            else
                input.parentElement.parentElement.classList.remove('disabled');
        });
        
        video.setAttribute('src', file.path);
        
    }
    
    function calculatePositionBar() {
        if ((Array.from(document.body.classList).includes('editor') || Array.from(document.body.classList).includes('processing')) && !videoPositionDragging && !trimStartDragging && !trimEndDragging && !volumeDragging) {
            
            console.log(trimStartPos, trimEndPos);
            
            if (video.currentTime >= trimEndPos && !video.paused)
                video.pause();
            
            if (video.currentTime < trimStartPos)
                video.currentTime = trimStartPos;
            else if (video.currentTime > trimEndPos)
                video.currentTime = trimEndPos;
            
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
            
            let videoWidth = document.getElementById('videoBar').getBoundingClientRect().width - 2,
                volumeWidth = document.getElementById('volumeBar').getBoundingClientRect().width;
            
            document.querySelector('#videoBar .position').style.left = video.currentTime/video.duration*videoWidth;
            document.querySelector('#videoBar .trimstart').style.left = trimStartPos/video.duration*videoWidth;
            document.querySelector('#videoBar .trimend').style.left = trimEndPos/video.duration*videoWidth;
            document.querySelector('#volumeBar .position').style.left = video.volume*volumeWidth;
            
            videoPos = video.currentTime;
        }
    }
    video.addEventListener('error', () => {
        console.error(video.error);
        document.body.classList.remove('processing');
        document.body.classList.add('error');
    });
    video.addEventListener('progress', () => {
        document.getElementById('currentTime').textContent = secondsToTime(Math.floor(video.currentTime));
        document.getElementById('endTime').textContent = secondsToTime(video.duration);
        trimEndPos = video.duration;
        calculatePositionBar();
        document.body.classList.remove('processing');
        document.body.classList.add('editor');
    });
    video.addEventListener('timeupdate', calculatePositionBar);
    video.addEventListener('volumechange', calculatePositionBar);
    video.addEventListener('click', () => {
        if (video.paused)
            video.play();
        else
            video.pause();
    });
    addEventListener('resize', calculatePositionBar);
    
    document.querySelector('#videoBar .position').addEventListener('mousedown', () => {
        videoPositionDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#videoBar .trimstart').addEventListener('mousedown', () => {
        trimStartDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#videoBar .trimend').addEventListener('mousedown', () => {
        trimEndDragging = true;
        savedLeftPosition = document.querySelector('#videoBar .position').style.left;
        video.pause();
    });
    document.querySelector('#volumeBar .position').addEventListener('mousedown', () => {
        volumeDragging = true;
    });
    
    document.addEventListener('mousemove', e => {
        let videoBar = document.getElementById('videoBar').getBoundingClientRect(),
            left = e.clientX - videoBar.left;

        if (left < 0)
            left = 0;
        else if (left > videoBar.width-2)
            left = videoBar.width-2;
        
        if (videoPositionDragging) {
            
            if (left < document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            else if (left > document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width;
            
            document.querySelector('#videoBar .position').style.left = left;
            
            video.currentTime = videoPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
        } else if (trimStartDragging) {
            
            if (left > document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimend').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width;
            
            document.querySelector('#videoBar .trimstart').style.left = left;
            
            video.currentTime = trimStartPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimStartPos >= videoPos)
                document.querySelector('#videoBar .position').style.left = left;
            else
                document.querySelector('#videoBar .position').style.left = savedLeftPosition;
            
        } else if (trimEndDragging) {
            
            if (left < document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left)
                left = document.querySelector('#videoBar .trimstart').getBoundingClientRect().left - videoBar.left;
            
            let percent = left/videoBar.width;
            
            document.querySelector('#videoBar .trimend').style.left = left;
            
            video.currentTime = trimEndPos = percent*video.duration;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(percent*video.duration));
            
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            
            if (trimEndPos <= videoPos)
                document.querySelector('#videoBar .position').style.left = left;
            else
                document.querySelector('#videoBar .position').style.left = savedLeftPosition;
            
        } else if (volumeDragging) {
            
            let volumeBar = document.getElementById('volumeBar').getBoundingClientRect();
            left = e.clientX - volumeBar.left;

            if (left < 0)
                left = 0;
            else if (left > volumeBar.width)
                left = volumeBar.width;
            
            let percent = left/volumeBar.width;
            
            document.querySelector('#volumeBar .position').style.left = left;
            
            video.volume = percent;
            
        }
        
    });
    document.addEventListener('mouseup', () => {
        videoPositionDragging = false;
        if (trimStartDragging || trimEndDragging) {
            video.currentTime = videoPos;
            document.getElementById('currentTime').textContent = secondsToTime(Math.floor(videoPos));
        }
        trimStartDragging = false;
        trimEndDragging = false;
        volumeDragging = false;
    });
    
    let currentFramePlay = null;
    
    const keysHolding = {
        ArrowLeft: () => {
            video.pause();
            video.currentTime = videoPos = Math.max(trimStartPos, video.currentTime - (1/data.streams.primary.video.framerate));
        },
        ArrowRight: () => {
            video.pause();
            video.currentTime = videoPos = Math.min(trimEndPos, video.currentTime + (1/data.streams.primary.video.framerate));
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
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
        },
        ']': () => {
            trimEndPos = video.currentTime;
            document.getElementById('endTime').textContent = secondsToTime(Math.floor(trimEndPos - trimStartPos));
            calculatePositionBar();
        },
        Enter: finishButton
    };
    
    document.addEventListener('keydown', e => {
        if (document.body.classList.contains('editor') && e.key in keysHolding) {
            e.preventDefault();
            keysHolding[e.key]();
        }
    });
    
    document.getElementById('fixmic').addEventListener('change', e => {
        if (e.target.checked) {
            document.getElementById('onlygame').checked = false;
            document.getElementById('onlygame').setAttribute('disabled', '');
        } else
            document.getElementById('onlygame').removeAttribute('disabled');
    });
    document.getElementById('onlygame').addEventListener('change', e => {
        if (e.target.checked) {
            document.getElementById('fixmic').checked = false;
            document.getElementById('fixmic').setAttribute('disabled', '');
        } else
            document.getElementById('fixmic').removeAttribute('disabled');
    });
    document.getElementById('tocompress').addEventListener('change', e => {
        if (!e.target.checked) {
            document.getElementById('compresssecondfile').checked = false;
            document.getElementById('compresssecondfile').setAttribute('disabled', '');
        } else
            document.getElementById('compresssecondfile').removeAttribute('disabled');
    });
    document.getElementById('compresssecondfile').addEventListener('change', e => {
    });
    
    document.querySelector('#finish .button').addEventListener('click', finishButton);
    
    function finishButton() {
        video.pause();
        
        document.body.classList.remove('editor');
        document.body.classList.add('editsprogress');
        
        runffmpeg();
    }
    
    /*
     * play/pause animation - nahh
     * display some data (maybe under advanced?)
     */
    
    //debug
    //xhandleFiles([{path:'/Users/jaketr00/Downloads/Call_of_Duty_Modern_Warfare_2019_2020.07.11_-_16.49.41.04.DVR.mp4_combined_audio_Trim.mp4'}])
    //document.body.classList.add('editsprogress');
    
    /*
     * https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020605.html
     * ffmpeg outputs data to stderr
     */
    
    function runffmpegCommand(command, percentFrom, percentTo) {
        
        return new Promise((complete, error) => {
        
            let ffmpegShell = shell.spawn(ffmpegDir, command);

            let preOutput = document.querySelector('#consoleoutput pre'),
                frameCount = Math.floor((trimEndPos-trimStartPos)/(1/data.streams.primary.video.framerate));
            
            ffmpegShell.stderr.on('data', stdout => {
                let toScroll = Math.abs(document.querySelector('#consoleoutput pre').scrollTop - (document.querySelector('#consoleoutput pre').scrollHeight - document.querySelector('#consoleoutput pre').getBoundingClientRect().height)) < 25;

                console.info(stdout.toString());
                preOutput.textContent+= '\n'+stdout;

                if (toScroll)
                    preOutput.scrollTop = preOutput.scrollHeight;

                if (stdout.toString().match(/frame= *(\d+) fps/g)) {
                    let currentFrame = parseInt(stdout.toString().match(/frame= *(\d+) fps/)[1]),
                        percent = currentFrame/frameCount;
                    
                    percent = Math.max(0, Math.min(100, percent));
                    percent = percent*(percentTo-percentFrom)+percentFrom;

                    document.querySelector('#progress .progressbar .progressinner').style.width = percent+'%';
                }

            });

            ffmpegShell.on('close', code => {
                console.log(`child process exited with code ${code}`);
                
                complete();
            });
            
        });
        
    }
    
    function runffmpeg() {
        //data
        //input: data.path.dir+'/'+data.path.name+data.path.ext
        //output: data.path.dir+'/'+data.path.name+'_edited'+data.path.ext
        //output compress as second file: data.path.dir+data.path.name+'_edited_compressed'+data.path.ext
        
        blockFile = true;
        
        let command = [],
            secondCommand = [];
        
        //['-i', data.path.dir+'/'+data.path.name+data.path.ext, '-b:v', '5000k', '/Users/jaketr00/Downloads/node compression test.mp4', '-y']
        
        if (!document.getElementById('fixmic').parentElement.parentElement.classList.contains('disabled')
            && document.getElementById('fixmic').checked)
            command = ['-filter_complex', '[0:a:1] afftdn=nt=w:om=o:tr= [l] ; [l] agate=threshold=.035 [l] ; [0:a:0] [l] amix=inputs=2 [a]', '-map', '0:v:0', '-map', '[a]'];
        else if (!document.getElementById('onlygame').parentElement.parentElement.classList.contains('disabled')
            && document.getElementById('onlygame').checked)
            command = ['-map', '0:v:0', '-map', '0:a:0'];
        
        if (document.getElementById('tocompress').checked) {
            
            if (document.getElementById('compresssecondfile').checked) {
                secondCommand = ['-b:v', '5000k'];
            } else
                command = [...command, '-b:v', '5000k'];
            
        } else
            command = [...command, '-acodec', 'copy', '-vcodec', 'copy'];
        
        command = ['-ss', trimStartPos, '-to', trimEndPos, ...command];
        
        runffmpegCommand(['-i', data.path.dir+'/'+data.path.name+data.path.ext, ...command, data.path.dir+'/'+data.path.name+'_edited'+data.path.ext, '-y'], 0, secondCommand.length ? 50 : 100).then(() => {
        
            if (secondCommand.length) {
                
                runffmpegCommand(['-i', data.path.dir+'/'+data.path.name+'_edited'+data.path.ext, ...secondCommand, data.path.dir+'/'+data.path.name+'_edited_compress'+data.path.ext, '-y'], 50, 100).then(() => {
                    document.querySelector('#progress .progressbar .progressinner').style.width = null;
                    document.querySelector('#progress .progressbar').classList.add('finished');
                    blockFile = false;
                });
                
            } else {
                document.querySelector('#progress .progressbar .progressinner').style.width = null;
                document.querySelector('#progress .progressbar').classList.add('finished');
                blockFile = false;
            }
        });
        
        
    }

    ipcRenderer.on('', (event, arg) => {
        
    });
    ipcRenderer.send('', {});

});