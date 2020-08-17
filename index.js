//basic variables
const {ipcRenderer, webFrame} = require('electron'),
      mime = require('mime'),
      getMimeType = str => mime.getType(str) || '', //mime.getType() return null if no result, empty string is easier for my usage
      os = require('os'),
      fs = require('fs'),
      path = require('path'),
      shell = require('child_process'),
      
      ffmpeg = require('fluent-ffmpeg'),
      
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
      
//easy round functions
const round = (num, closest=1) => Math.round(num/closest)*closest;
round.ceil = (num, closest=1) => Math.ceil(num/closest)*closest;
round.floor = (num, closest=1) => Math.floor(num/closest)*closest;

//number mapping
// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
const mapNumber = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};


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
            bitrate: parseInt(rawdata.format.bit_rate),
            duration: parseFloat(rawdata.format.duration),
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
     * https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020605.html
     * ffmpeg outputs data to stderr
     */
    
    /*function runffmpegCommand(command, percentFrom, percentTo) {
        
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
        
    }*/
    
    function runffmpegCommand(commands, iteration=0, promiseComplete, promiseError) {
        
        let run = (complete, error) => {
        
            commands[iteration].finish().then(command => {
                
                let ffmpegShell = shell.spawn(ffmpegDir, command);
                console.log(command);

                let preOutput = document.querySelector('#consoleoutput pre'),
                    frameCount = Math.floor(videoEditor.data().duration/(1/data.streams.primary.video.framerate));

                ffmpegShell.stderr.on('data', stdout => {
                    let toScroll = Math.abs(document.querySelector('#consoleoutput pre').scrollTop - (document.querySelector('#consoleoutput pre').scrollHeight - document.querySelector('#consoleoutput pre').getBoundingClientRect().height)) < 25;

                    console.info(stdout.toString());
                    preOutput.textContent+= '\n'+stdout;

                    if (toScroll)
                        preOutput.scrollTop = preOutput.scrollHeight;

                    if (stdout.toString().match(/frame= *(\d+) fps/g)) {
                        let currentFrame = parseInt(stdout.toString().match(/frame= *(\d+) fps/)[1]),
                            percent = Math.max(0, Math.min(100, currentFrame/frameCount));

                        percent = mapNumber(percent, 0, 1, 100/commands.length*iteration, 100/commands.length*(iteration+1));

                        document.querySelector('#progress .progressbar .progressinner').style.width = round(percent, .01)+'%';
                    }

                });

                ffmpegShell.on('close', code => {
                    console.log(`child process exited with code ${code}`);

                    if (commands.length-1 > iteration)
                        runffmpegCommand(commands, iteration+1, complete, error);
                    else
                        complete();
                });
                
            }).catch(error);
            
        };
        
        if (iteration > 0)
            run(promiseComplete, promiseError);
        else
            return new Promise((complete, error) => run(complete, error));
    }
    
    function runffmpeg() {
        //data
        //input: data.path.dir+'/'+data.path.name+data.path.ext
        //output: data.path.dir+'/'+data.path.name+'_edited'+data.path.ext
        //output compress as second file: data.path.dir+data.path.name+'_edited_compressed'+data.path.ext
        
        blockFile = true;
        
        //array of commands
        let commands = [],
            commandTemplate = (input, output) => {
                
                //basic info
                let ret = {
                    input,
                    output,
                    audio: false,
                    video: false,
                    command: ffmpeg(input.name+input.ext).output(output.name+output.ext)
                };
                
                //use acodec/vcodec copy if needed and prepare the command
                ret.finish = () => {
                    return new Promise((complete, fail) => {
                        
                        if (!ret.audio)
                            ret.command.audioCodec('copy');
                        if (!ret.video)
                            ret.command.videoCodec('copy');
                        ret.command._prepare(function(err, args) {
                            if (err)
                                fail(err);
                            else
                                complete(args);
                        });
                        
                    });
                };
                
                return ret;
            };
        
        commands[0] = commandTemplate({
            name: data.path.dir+'/'+data.path.name,
            ext: data.path.ext
        }, {
            name: data.path.dir+'/'+data.path.name+'_edited',
            ext: data.path.ext
        });
        
        /*
        ffmpeg('/path/to/file.avi').complexFilter([
          {
            filter: 'afftdn', options: {nt:'w',om:'o',tr:''},
            inputs: '[0:a:1]', outputs: 'a'
          },
          {
            filter: 'agate', options: {threshold:'.035'},
            inputs: 'a', outputs: 'a'
          },
          {
            filter: 'amix', options: {inputs:'2'},
            inputs: ['[0:a:0]', 'a'], outputs: 'a'
          }
        ]).outputOptions('-map', '0:v:0', '-map', '[a]')._prepare(function(err, args) {console.log(args)});
        */
        
        //this entire thing needs to be made better
        
        if (!document.getElementById('fixmic').parentElement.classList.contains('disabled')
            && document.getElementById('fixmic').checked) {
            
            //noise reduction on mic and combine channels
            
            commands[0].command.complexFilter([
                {
                    filter: 'afftdn', options: {nt:'w',om:'o',tr:''},
                    inputs: '[0:a:1]', outputs: 'a'
                },
                {
                    filter: 'agate', options: {threshold:'.035'},
                    inputs: 'a', outputs: 'a'
                },
                {
                    filter: 'amix', options: {inputs:'2'},
                    inputs: ['[0:a:0]', 'a'], outputs: 'a'
                }
            ]).outputOptions('-map', '0:v:0', '-map', '[a]');
            commands[0].audio = true;
            
            //command = ['-filter_complex', '[0:a:1] afftdn=nt=w:om=o:tr= [l] ; [l] agate=threshold=.035 [l] ; [0:a:0] [l] amix=inputs=2 [a]', '-map', '0:v:0', '-map', '[a]'];
            
        } else if (!document.getElementById('onlygame').parentElement.classList.contains('disabled')
            && document.getElementById('onlygame').checked) {
            
            //only use game audio
            
            commands[0].command.outputOptions('-map', '0:v:0', '-map', '0:a:0');
            
            
            //command = ['-map', '0:v:0', '-map', '0:a:0'];
        }
        
        if (document.getElementById('tocompress').checked) {
            
            if (document.getElementById('compresssecondfile').checked) { //compress in second file
                
                commands[1] = commandTemplate(commands[0].output, {
                    name: commands[0].output.name+'_compressed',
                    ext: commands[0].output.ext
                });
                commands[1].command.videoBitrate('5000k');
                
                commands[1].video = commands[1].audio = true;
                
            } else //compress in same file
                commands[0].command.videoBitrate('5000k');
            
        } /*else
            command = [...command, '-acodec', 'copy', '-vcodec', 'copy'];*/
        
        if (round.floor(videoEditor.data().trimStartPos, .01) !== 0)
            commands[0].command.seekInput(videoEditor.data().trimStartPos);
        if (round.ceil(videoEditor.data().trimEndPos, .01) !== data.duration)
            commands[0].command.inputOptions('-to '+videoEditor.data().trimEndPos);
        //command = ['-ss', trimStartPos, '-to', trimEndPos, ...command];
        
        runffmpegCommand(commands).then(() => {
            document.querySelector('#progress .progressbar .progressinner').style.width = null;
            document.querySelector('#progress .progressbar').classList.add('finished');
            blockFile = false;
        }).catch(err => {
            console.error(`error: ${err}`);
            document.body.classList.remove('editsprogress');
            document.body.classList.add('error');
        });
        
        /*runffmpegCommand(['-i', data.path.dir+'/'+data.path.name+data.path.ext, ...command, data.path.dir+'/'+data.path.name+'_edited'+data.path.ext, '-y'], 0, secondCommand.length ? 50 : 100).then(() => {
        
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
        });*/
        
        
    }
    
    /* error */
    
    document.querySelector('#error .small').addEventListener('click', () => {
        ipcRenderer.send('devtools');
    });
    

    /*ipcRenderer.on('', (event, arg) => {
        
    });
    ipcRenderer.send('', {});*/

});
