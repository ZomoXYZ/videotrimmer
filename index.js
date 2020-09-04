//basic variables
const {ipcRenderer, webFrame} = require('electron'),
      mime = require('mime'),
      getMimeType = str => mime.getType(str) || '', //mime.getType() return null if no result, empty string is easier for my usage
      os = require('os'),
      fs = require('fs'),
      path = require('path'),
      shell = require('child_process'),
      
      Version = require('./package.json').version,//
      
      ffmpeg = require('fluent-ffmpeg'),
      
      secondsToTime = seconds => { //1000 (seconds) -> 16:40 (minutes:seconds)
          seconds = Math.floor(seconds);
          seconds = Math.max(0, seconds);
          var minutes = Math.floor(seconds / 60);
          seconds = seconds - (minutes * 60);

          if (minutes < 10) {minutes = "0"+minutes;}
          if (seconds < 10) {seconds = "0"+seconds;}
          return minutes+':'+seconds;
      };

var ffDir, ffmpegDir, ffprobeDir;

//easy round functions
const round = (num, closest=1) => Math.round(num/closest)*closest;
round.ceil = (num, closest=1) => Math.ceil(num/closest)*closest;
round.floor = (num, closest=1) => Math.floor(num/closest)*closest;

//number mapping
// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
const mapNumber = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

//prevent zooming
webFrame.setVisualZoomLevelLimits(1, 1);

//on ffmpeg downloaded
var MainReady = false;
ipcRenderer.on('loaded', (event, data) => {
    
    //ffmpeg binaries https://ffbinaries.com/downloads
    ffDir = path.join(data, 'ffmpeg-binaries');
    ffmpegDir = path.join(ffDir, 'ffmpeg');
    ffprobeDir = path.join(ffDir, 'ffprobe');

    //in case an error happened in main.js
    if (!fs.existsSync(ffDir))
        ipcRenderer.send('exit', 'OS IS NOT SET UP');

    //aaaaaah
    ffmpeg.setFfmpegPath(ffmpegDir);
    
    //block file hover
    if (['complete', 'interactive'].includes(document.readyState))
        document.body.classList.remove('loadingMain');
});
ipcRenderer.send('isLoaded');

addEventListener('load', () => {
    
    if (MainReady)
        document.body.classList.remove('loadingMain');
    
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
    
    //display version number
    document.getElementById('version').textContent = Version;
    
    //check for update
    require('https').get('https://raw.githubusercontent.com/ZomoXYZ/videotrimmer/master/package.json', res => {
        res.on('data', data => {
            try {
                data = JSON.parse(data);
                
                let currentVersion = Version.split('.'),
                    newVersion = data.version.split('.');
                
                for (let i = 0; i < 3; i++) {
                    let cv = parseInt(currentVersion[i]),
                        nv = parseInt(newVersion[i]);
                    if (nv > cv) {
                        document.getElementById('version').classList.add('update');
                        break;
                    }
                }
                
            } catch(e) {}
        });
    });
    
    //html's "video/*" sucks so this accepts all actual videos
    var videoExts = [];
    for (let ext in mime._types)
        if (mime._types[ext].startsWith('video/'))
            videoExts.push('.'+ext);
    document.getElementById('fileupload').setAttribute('accept', videoExts.join(','));
    
    var blockFile = false, //should block file from being dragged over
        draggedover = false;
    
    //file drag+drop listeners
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
        document.body.classList.remove('hoveringVideo');
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

    //handle file input
    function handleFiles(files) {
        document.body.setAttribute('class', 'processing');
        
        videoEditor.open(document.querySelector('#editor video'));
        videoEditor.onload(editorScaleDo);
        
        document.querySelector('#progress .progressbar').classList.remove('finished');

        console.log(files);
        
        files = Array.from(files).filter(f => getMimeType(f.path).split('/')[0] === 'video');
        
        if (files.length)
            processVideo(files[0]);
        else
            document.body.removeAttribute('class');
    }
    
    /* processing video */
    
    //ffprobe file and process the data
    function processVideo(file) {
        
        //ffprobe time
        let probe = shell.spawn(ffprobeDir, ['-v', 'error', '-show_format', '-show_streams', '-print_format', 'json', file.path]),
            output = '';
        probe.stdout.on('data', stdout => {
            output+= stdout;
        });

        probe.stderr.on('data', stderr => {
            console.error('stderr', stderr);
            document.body.classList.remove('processing');
        });

        probe.on('close', code => {
            console.log(`child process exited with code ${code}`);
            output = JSON.parse(output);
            console.log(output);
            
            displayEditor(file, output);
        });
        
    }
    
    //function to create an object of each stream's data
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
    
    //function to create an objecy of video data
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
    
    //null data so functions will not error before the data is filled out
    var data = {
        bitrate: 0,
        duration: 0,
        format: '',
        filename: '',
        streams: getStreamsData(),
        path: ''
    };
    
    //take data and display the editor
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
    
    //checkbox exclusivity listeners
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
    
    //finish button
    document.querySelector('#finish .button').addEventListener('click', finishButton);
    function finishButton() {
        videoEditor.close();
        
        document.body.classList.remove('editor');
        document.body.classList.add('editsprogress');
        
        runffmpeg();
    }
    //Enter for finish button
    document.addEventListener('keydown', e => {
        if (document.body.classList.contains('editor') && e.key === 'Enter')
            finishButton();
    });
    
    //scale for editor page to ensure entire page stays visible
    let editorScale = 1;
    const editorScaleDo = () => {
        
        let height = parseFloat(getComputedStyle(document.getElementById('editorInner')).height)
                     + parseFloat(getComputedStyle(document.getElementById('editor')).padding)*2;
        
        if (innerHeight < height) {
            editorScale = innerHeight/height;
            document.getElementById('editor').style.transform = `scale(${editorScale}, ${editorScale})`;
        } else 
            document.getElementById('editor').style.transform = `scale(1, 1)`;
    };
    addEventListener('resize', editorScaleDo);
    
    /* loading edits */
    
    /*
     * https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020605.html
     * ffmpeg outputs data to stderr
     */
    
    //recursive function to run commands
    function runffmpegCommand(commands, iteration=0, promiseComplete, promiseError) {
        
        let run = (complete, error) => {
        
            //create the command
            commands[iteration].finish().then(command => {
                
                //run the command
                let ffmpegShell = shell.spawn(ffmpegDir, command);
                console.log(command);

                //basic data stored that shouldn't be recalculated everytime ffmpeg outputs data
                let preOutput = document.querySelector('#consoleoutput pre'),
                    frameCount = Math.floor(videoEditor.data().duration/(1/data.streams.primary.video.framerate));

                //on ffmpeg data output
                ffmpegShell.stderr.on('data', stdout => {
                    
                    //if it's already scrolled to the bottom then keep it scrolled to the bottom
                    let toScroll = Math.abs(document.querySelector('#consoleoutput pre').scrollTop - (document.querySelector('#consoleoutput pre').scrollHeight - document.querySelector('#consoleoutput pre').getBoundingClientRect().height)) < 25;

                    //output data so user can read it
                    console.info(stdout.toString());
                    preOutput.textContent+= '\n'+stdout;

                    if (toScroll)
                        preOutput.scrollTop = preOutput.scrollHeight;

                    //calculate percent and display percent in progress bar
                    if (stdout.toString().match(/frame= *(\d+) fps/g)) {
                        let currentFrame = parseInt(stdout.toString().match(/frame= *(\d+) fps/)[1]),
                            percent = Math.max(0, Math.min(100, currentFrame/frameCount));

                        percent = mapNumber(percent, 0, 1, 100/commands.length*iteration, 100/commands.length*(iteration+1));

                        document.querySelector('#progress .progressbar .progressinner').style.width = round(percent, .01)+'%';
                    }

                });
                
                //cancel button
                let cancelButton = () => {
                    ffmpegShell.kill('SIGINT')
                };
                document.getElementById('returncancel').addEventListener('click', cancelButton);

                //on ffmpeg done
                ffmpegShell.on('close', code => {
                    console.log(`child process exited with code ${code}`);
                    
                    //disable cancel button
                    document.getElementById('returncancel').removeEventListener('click', cancelButton);
                    
                    //recurse if there's another command, otherwise return
                    if (commands.length-1 > iteration)
                        runffmpegCommand(commands, iteration+1, complete, error);
                    else
                        complete();
                });
                
            }).catch(error);
            
        };
        
        //if iteration > 0 then this function is already in a promise and shouldn't create a second
        if (iteration > 0)
            run(promiseComplete, promiseError);
        else
            return new Promise((complete, error) => run(complete, error));
    }
    
    function runffmpeg() {
        
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
        
        //set up main command
        commands[0] = commandTemplate({
            name: data.path.dir+'/'+data.path.name,
            ext: data.path.ext
        }, {
            name: data.path.dir+'/'+data.path.name+'_edited',
            ext: data.path.ext
        });
        
        
        if (!document.getElementById('fixmic').parentElement.classList.contains('disabled')
            && document.getElementById('fixmic').checked) { //noise reduction on mic and combine channels
            
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
            
        } else if (!document.getElementById('onlygame').parentElement.classList.contains('disabled')
            && document.getElementById('onlygame').checked) //only use game audio
            
            commands[0].command.outputOptions('-map', '0:v:0', '-map', '0:a:0');
        
        
        if (document.getElementById('tocompress').checked) {
            
            if (document.getElementById('compresssecondfile').checked) { //compress in second file
                
                commands[1] = commandTemplate(commands[0].output, {
                    name: commands[0].output.name+'_compressed',
                    ext: commands[0].output.ext
                });
                commands[1].command.videoBitrate('5000k');
                
                commands[1].video = commands[1].audio = true;
                
            } else { //compress in same file
                commands[0].command.videoBitrate('5000k');
                commands[0].video = true;
            }
            
        }
        
        //set start/end positions
        if (round.floor(videoEditor.data().trimStartPos, .01) !== 0)
            commands[0].command.seekInput(videoEditor.data().trimStartPos);
        if (round.ceil(videoEditor.data().trimEndPos, .01) !== data.duration)
            commands[0].command.inputOptions('-to '+videoEditor.data().trimEndPos);
        
        //run the commands
        runffmpegCommand(commands).then(() => {
            document.querySelector('#progress .progressbar .progressinner').style.width = null;
            document.getElementById('editsprogress').classList.add('finished');
            blockFile = false;
        }).catch(err => {
            console.error('error', err);
            document.body.classList.remove('editsprogress');
        });
        
        
    }
    
    //done button
    document.getElementById('returndone').addEventListener('click', () => {
        document.body.classList.remove('editsprogress');
    });
    
    /* error */
    
    //open dev tools button
    document.querySelector('#error .small').addEventListener('click', () => {
        ipcRenderer.send('devtools');
    });
    
    //select entire error on click
    document.querySelector('#errordisplay pre').addEventListener('click', () => {
        var range = document.createRange();
        range.selectNode(document.querySelector('#errordisplay pre'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    });

});

//the error object is dumb and will not JSON.stringify correctly
function jsonifyerror(msg) {
    let obj = {};
    for (let key in msg) {
        if (key === 'error')
            obj.error = {
                message: msg.error.message,
                stack: msg.error.stack
            };
        else if (!['currentTarget', 'path', 'srcElement', 'target'].includes(key))
            obj[key] = msg[key];
    }
    
    return obj;
}

//general error catch
addEventListener('error', (msg, url, line, col, error) => {
    let fixedmsg = jsonifyerror(msg);
    document.body.classList.add('error');
    document.querySelector('#errordisplay pre').textContent = JSON.stringify(fixedmsg, null, 2);
    console.log(msg, fixedmsg);
});
