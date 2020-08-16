//basic variables
const {ipcRenderer, webFrame} = require('electron'),
      mime = require('mime'),
      getMimeType = str => mime.getType(str) || '', //mime.getType() return null if no result, empty string is easier for my usage
      os = require('os'),
      fs = require('fs'),
      path = require('path'),
      shell = require('child_process'),
      
      secondsToTime = seconds => { //1000 (seconds) -> 16:40 (minutes:seconds)
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

//Location to store ffmpeg binaries
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
            ipcRenderer.send('exit', 'Unsupported platform');
        }
    }
}

//prevent zooming
webFrame.setVisualZoomLevelLimits(1, 1);

//in case an error happened in main.js
if (!fs.existsSync(ffDir))
    ipcRenderer.send('exit', 'OS IS NOT SET UP');

addEventListener('load', () => {
    
    //declarations outside of page scope
    const videoEditor = require('./modules/editor.js')(document.querySelector('#editor video'), () => {
        blockFile = false;
    });
    
    /* general declarations by page
     * 
     * upload screen/hover
     * processing video
     * editing page
     * loading edits
     * error
     */
    
    /* upload screen/hover */
    
    //html's "video/*" sucks so this accepts all actual videos
    var videoExts = [];
    for (let ext in mime._types)
        if (mime._types[ext].startsWith('video/'))
            videoExts.push('.'+ext);
    document.getElementById('fileupload').setAttribute('accept', videoExts.join(','));
    
    var blockFile = false, //should block file from being dragged over
        draggedover = false;
    
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
        
        videoEditor.open(document.querySelector('#editor video'));
        
        document.querySelector('#progress .progressbar').classList.remove('finished');

        console.log(files);
        //files[i].path
        files = Array.from(files).filter(f => getMimeType(f.path).split('/')[0] === 'video');
        
        if (files.length)
            processVideo(files[0]);
        else
            document.body.removeAttribute('class');
    }
    
    /* processing video */
    
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
    
    /* editing page */
    
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
                input.parentElement.classList.add('disabled');
            else
                input.parentElement.classList.remove('disabled');
        });
        
        videoEditor.src(file.path);
        
    }
    
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
        videoEditor.close();
        
        document.body.classList.remove('editor');
        document.body.classList.add('editsprogress');
        
        runffmpeg();
    }
    
    document.addEventListener('keydown', e => {
        if (document.body.classList.contains('editor') && e.key === 'Enter')
            finishButton();
    });
    
    /* loading edits */
    
    /*
     * play/pause animation - nahh
     * display some data (maybe under advanced?)
     */
    
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
        
        //this entire thing needs to be made better
        
        let command = [],
            secondCommand = [];
        
        if (!document.getElementById('fixmic').parentElement.classList.contains('disabled')
            && document.getElementById('fixmic').checked)
            command = ['-filter_complex', '[0:a:1] afftdn=nt=w:om=o:tr= [l] ; [l] agate=threshold=.035 [l] ; [0:a:0] [l] amix=inputs=2 [a]', '-map', '0:v:0', '-map', '[a]'];
        else if (!document.getElementById('onlygame').parentElement.classList.contains('disabled')
            && document.getElementById('onlygame').checked)
            command = ['-map', '0:v:0', '-map', '0:a:0'];
        
        if (document.getElementById('tocompress').checked) {
            
            if (document.getElementById('compresssecondfile').checked) {
                secondCommand = ['-b:v', '5000k'];
            } else
                command = [...command, '-b:v', '5000k'];
            
        } /*else
            command = [...command, '-acodec', 'copy', '-vcodec', 'copy'];*/
        
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
    
    /* error */
    
    document.querySelector('#error .small').addEventListener('click', () => {
        ipcRenderer.send('devtools');
    });
    

    /*ipcRenderer.on('', (event, arg) => {
        
    });
    ipcRenderer.send('', {});*/

});
