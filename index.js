//basic variables
const { ipcRenderer, webFrame, remote} = require('electron'),
    { nativeTheme } = remote,
    mime = require('mime'),
    getMimeType = str => mime.getType(str) || '', //mime.getType() return null if no result, empty string is easier for my usage
    os = require('os'),
    fs = require('fs'),
    path = require('path'),
    shell = require('child_process'),
    rimraf = require('rimraf'),
    
    Version = require('./package.json').version,//
    
    ffmpeg = require('fluent-ffmpeg');

var settings, appDataPath, ffDir, ffmpegDir, ffprobeDir, settingsPath;

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
var MainReady = false,
    blockFile = true;//should block file from being dragged over
ipcRenderer.on('loaded', (event, data) => {
    
    //ffmpeg binaries https://ffbinaries.com/downloads
    appDataPath = data;
    ffDir = path.join(data, 'ffmpeg-binaries');
    ffmpegDir = path.join(ffDir, 'ffmpeg');
    ffprobeDir = path.join(ffDir, 'ffprobe');
    settingsPath = path.join(data, 'storage');

    //in case an error happened in main.js
    if (!fs.existsSync(ffDir))
        ipcRenderer.send('exit', 'OS IS NOT SET UP');
    
    onLoad();
    
});
ipcRenderer.send('isLoaded');

function updateTheme() {
    //dark/light theme
    document.body.setAttribute('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    //high contrast
    if (nativeTheme.shouldUseHighContrastColors)
        document.body.setAttribute('contrast', '');
    else
        document.body.removeAttribute('contrast');

    //invert
    if (nativeTheme.shouldUseInvertedColorScheme)
        document.body.setAttribute('invert', '');
    else
        document.body.removeAttribute('invert');
}

addEventListener('load', () => onLoad);

const loadMax = 1;
var loadCheck = 0;
function onLoad() {

    if (loadCheck < loadMax) {
        loadCheck++;
        return;
    }

    if (!fs.existsSync(settingsPath))
        fs.mkdirSync(settingsPath);

    //settingsOrig.setDataPath(path.join(ffDir, 'storage'));

    let settingsProxy = {
        get(_, prop) {
            if (!fs.existsSync(path.join(settingsPath, prop + '.json')))
                return undefined;

            try {
                return JSON.parse(fs.readFileSync(path.join(settingsPath, prop + '.json')).toString());
            } catch (e) {
                return undefined;
            }
        },
        set(_, prop, value) {
            //console.log
            return fs.writeFileSync(path.join(settingsPath, prop + '.json'), JSON.stringify(value));
        }
    };

    settings = new Proxy({}, settingsProxy);

    if (settings.autoupdate === undefined)
        settings.autoupdate = true;
    if (settings.theme === undefined)
        settings.theme = 'system';
    if (settings.dyslexic === undefined)
        settings.dyslexic = false;

    //aaaaaah
    ffmpeg.setFfmpegPath(ffmpegDir);

    MainReady = true;

    if (['complete', 'interactive'].includes(document.readyState)) {
        document.body.classList.remove('loadingMain');
        blockFile = false;
    }

    if (MainReady) {
        document.body.classList.remove('loadingMain');
        blockFile = false;
    }

    //declarations outside of page scope
    const videoEditor = require('./modules/editor.js')(document.querySelector('#editor video'), () => {
        blockFile = false;
    }, throwError, settings);

    /* general declarations by page
     * 
     * upload screen/hover
     * settings
     * processing video
     * editing page
     * loading edits
     * error
     */

    /* upload screen/hover */

    //display version number
    document.getElementById('version').textContent = Version;

    //settings button
    document.getElementById('settingsButton').addEventListener('click', () => document.body.classList.add('settings'), false);

    //check for update
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            try {
                let data = JSON.parse(xhttp.response);

                let currentVersion = Version.split('.'),
                    newVersion = data.version.split('.');

                for (let i = 0; i < 3; i++) {
                    let cv = parseInt(currentVersion[i]),
                        nv = parseInt(newVersion[i]);
                    if (nv > cv) {
                        document.getElementById('version').classList.add('update');
                        break;
                    } else if (cv > nv)
                        break;
                }

            } catch (e) { }
        }
    };
    xhttp.open('GET', 'https://raw.githubusercontent.com/ZomoXYZ/videotrimmer/master/package.json');
    xhttp.send();

    //html's "video/*" sucks so this accepts all actual videos
    var videoExts = [];
    for (let ext in mime._types)
        if (mime._types[ext].startsWith('video/'))
            videoExts.push('.' + ext);
    document.getElementById('fileupload').setAttribute('accept', videoExts.join(','));

    //file drag+drop listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false); //prevent defualt
    });
    document.addEventListener('dragover', e => {
        if (!blockFile)
            document.body.classList.add('hoveringVideo');
    });
    document.addEventListener('dragleave', e => {
        document.body.classList.remove('hoveringVideo');
    });
    document.addEventListener('drop', e => {
        if (!blockFile)
            document.body.classList.remove('hoveringVideo');
    });
    document.addEventListener('drop', e => {
        if (!blockFile)
            handleFiles(e.dataTransfer.files);
    }, false);
    document.getElementById('fileupload').addEventListener('change', function () {
        if (!blockFile)
            handleFiles(this.files);
    }, false);

    //handle file input
    function handleFiles(files) {
        document.body.setAttribute('class', 'processing');

        videoEditor.open(document.querySelector('#editor video'));
        videoEditor.onload(editorScaleDo);

        document.getElementById('editsprogress').classList.remove('finished');

        console.log(files);

        files = Array.from(files).filter(f => getMimeType(f.path).split('/')[0] === 'video');

        if (files.length)
            processVideo(files[0]);
        else
            document.body.removeAttribute('class');
    }

    /* settings */

    //auto update
    document.getElementById('autoupdatetoggle').checked = settings.autoupdate;
    document.getElementById('autoupdatetoggle').addEventListener('change', e => {
        settings.autoupdate = e.target.checked;
    }, false);

    //theme
    try {
        nativeTheme.themeSource = settings.theme;
    } catch (e) {
        settings.theme = 'system';
        nativeTheme.themeSource = settings.theme;
    }
    document.getElementById('themeselect').value = settings.theme;
    document.getElementById('themeselect').addEventListener('change', e => {
        document.body.setAttribute('theme', e.target.value);
        settings.theme = e.target.value;
        nativeTheme.themeSource = settings.theme;
    }, false);

    updateTheme();
    nativeTheme.on('updated', updateTheme);

    //dyslexia
    if (settings.dyslexic)
        document.body.setAttribute('dyslexic', '');
    else
        document.body.removeAttribute('dyslexic');
    document.getElementById('dyslexictoggle').checked = settings.dyslexic;
    document.getElementById('dyslexictoggle').addEventListener('change', e => {
        if (e.target.checked)
            document.body.setAttribute('dyslexic', '');
        else
            document.body.removeAttribute('dyslexic');
        settings.dyslexic = e.target.checked;
    }, false);

    document.getElementById('deletetemp').addEventListener('click', () => {
        document.body.classList.remove('settings');
        document.body.classList.add('loadingMain');

        setTimeout(() => {
            let tempDir = path.join(ffDir, 'temp');
            if (fs.existsSync(tempDir)) {
                rimraf.sync(path.join(ffDir, 'temp'));
                fs.mkdirSync(tempDir)
            }
            document.body.classList.remove('loadingMain');
            document.body.classList.add('settings');
        }, 200);
    }, false);

    document.getElementById('deleteall').addEventListener('click', () => {
        document.body.classList.remove('settings');
        document.body.classList.add('loadingMain');

        setTimeout(() => {
            rimraf.sync(ffDir);
            require('electron').remote.getCurrentWindow().close();

        }, 200);
    }, false);

    document.getElementById('closeSettings').addEventListener('click', () => document.body.classList.remove('settings'), false);

    /* processing video */

    //ffprobe file and process the data
    function processVideo(file) {

        //ffprobe time
        let probe = shell.spawn(ffprobeDir, ['-v', 'error', '-show_format', '-show_streams', '-print_format', 'json', file.path]),
            output = '';
        probe.stdout.on('data', stdout => {
            output += stdout;
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
    function getStreamsData(streams = []) {
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
    function getStreamData(stream = {
        avg_frame_rate: '0',
        bit_rate: '0',
        codec_long_name: '',
        codec_name: '',
        width: 0,
        height: 0,
        display_aspect_ratio: '',
        duration: 0
    }, type) {
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

        videoEditor.src(data);

    }

    //finish button
    document.querySelector('#finish .button').addEventListener('click', finishButton);
    function finishButton() {
        //videoEditor.close();
        videoEditor.finish(runffmpegEach, [ffDir, ffmpegDir, ffprobeDir]);

        document.body.classList.remove('editor');
        document.body.classList.add('editsprogress');

        //runffmpeg();


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
            + parseFloat(getComputedStyle(document.getElementById('editor')).padding) * 2;

        if (innerHeight < height) {
            editorScale = innerHeight / height;
            document.getElementById('editor').style.transform = `scale(${editorScale}, ${editorScale})`;
        } else
            document.getElementById('editor').style.transform = `scale(1, 1)`;
    };
    addEventListener('resize', editorScaleDo);
    addEventListener('click', () => setTimeout(editorScaleDo, 10));

    /* loading edits */

    /*
     * https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020605.html
     * ffmpeg outputs data to stderr
     */

    //this has no error handling (must be done by parsing output)
    function runffmpegEachCommand(command, startpercent, endpercent, part, totalpart) {

        document.querySelector('#progress .progresstext .part').textContent = `${part}/${totalpart}`;
        if (startpercent === 0) {
            document.querySelector('#progress .progressbar .progressinner').style.width = '30px';
            document.querySelector('#progress .progresstext .eta').textContent = 'calculating';
        }

        //command is array of args

        let run = (complete, error) => {

            //run the command
            let ffmpegShell = shell.spawn(ffmpegDir, command);
            console.log(command);

            //basic data stored that shouldn't be recalculated everytime ffmpeg outputs data
            let preOutput = document.querySelector('#consoleoutput pre'),
                frameCount = Math.floor(videoEditor.data().duration / (1 / data.streams.primary.video.framerate)),
                timeAvgs = [],
                lastTime = null,
                lastFrame = 0;


            //on ffmpeg data output
            ffmpegShell.stderr.on('data', stdout => {

                stdout = stdout.toString();

                //if it's already scrolled to the bottom then keep it scrolled to the bottom
                let toScroll = Math.abs(document.querySelector('#consoleoutput pre').scrollTop - (document.querySelector('#consoleoutput pre').scrollHeight - document.querySelector('#consoleoutput pre').getBoundingClientRect().height)) < 25;

                //output data so user can read it
                console.info(stdout);
                preOutput.textContent += '\n' + stdout;

                if (toScroll)
                    preOutput.scrollTop = preOutput.scrollHeight;

                //calculate percent and display percent in progress bar
                if (stdout.match(/frame= *(\d+) fps/g)) {
                    let currentFrame = parseInt(stdout.match(/frame= *(\d+) fps/)[1]),
                        percent = Math.max(0, Math.min(1, currentFrame / frameCount)),
                        vidualpercent = mapNumber(percent, 0, 1, startpercent, endpercent),
                        timeRemaining = 'calculating';

                    if (lastTime === null) {
                        lastTime = new Date();
                        lastFrame = currentFrame;
                    } else {
                        timeAvgs.push((new Date() - lastTime) / (currentFrame - lastFrame));

                        while (timeAvgs.length > 20)
                            timeAvgs.shift();

                        //calculate average time (in miliseconds) per frame over the last 0-20 stdout events 
                        let avgPerFrame = 0;
                        for (let t of timeAvgs)
                            avgPerFrame += t;
                        avgPerFrame /= timeAvgs.length;

                        if (avgPerFrame > 0) // if it's less than 0 then idk, it just said -Infinity for some reason
                            timeRemaining = Math.round(avgPerFrame * (frameCount - currentFrame) / 1000);

                    }

                    //needs minimum 30px
                    //30px is ?%
                    let minpercent = (document.querySelector('#progress .progressbar').getBoundingClientRect().width - 10) / 30 / 100;

                    vidualpercent = mapNumber(vidualpercent, 0, 1, minpercent, 1);

                    document.querySelector('#progress .progressbar .progressinner').style.width = round(vidualpercent * 100, .01) + '%';

                    document.querySelector('#progress .progresstext .part').textContent = `${part}/${totalpart}`;
                    document.querySelector('#progress .progresstext .eta').textContent = timeRemaining;

                }

            });

            //cancel button
            let cancelled = false;
            let cancelButton = () => {
                ffmpegShell.kill('SIGINT');
                cancelled = true;
            };
            document.getElementById('returncancel').addEventListener('click', cancelButton);

            //on ffmpeg done
            ffmpegShell.on('close', code => {
                console.log(`child process exited with code ${code}`);

                //disable cancel button
                document.getElementById('returncancel').removeEventListener('click', cancelButton);

                //recurse if there's another command, otherwise return
                complete(cancelled);
            });

        };

        return new Promise((complete, error) => run(complete, error));
    }

    function runffmpegEach(total) {

        blockFile = true;

        let current = 0,
            eachPercent = 1 / total;

        function eachCommand(args) {
            return new Promise((complete, error) => {

                runffmpegEachCommand(args, eachPercent * current, eachPercent * (current + 1), current + 1, total).then(() => {
                    complete();
                }).catch(err => {
                    //console.error('error', err);
                    document.body.classList.remove('editsprogress');
                    error(err);
                });

                current++;

            });
        }

        eachCommand.finish = () => {
            document.querySelector('#progress .progressbar .progressinner').style.width = null;
            document.getElementById('editsprogress').classList.add('finished');
            blockFile = false;
        };

        //prePrepare(cmd, isfirst, islast);
        eachCommand.prePrepare = (command, isfirst, islast) => {
            if (isfirst) {

                //set start/end positions

                if (round.floor(videoEditor.data().trimStartPos, .01) !== 0)
                    command.seekInput(videoEditor.data().trimStartPos);
                if (round.ceil(videoEditor.data().trimEndPos, .01) !== round.ceil(data.duration, .01))
                    command.inputOptions('-to ' + videoEditor.data().trimEndPos);
            }
        };

        return eachCommand;

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

}

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
function throwError(err) {
    let fixedmsg = jsonifyerror(err);
    document.body.classList.add('error');
    document.querySelector('#errordisplay pre').textContent = JSON.stringify(fixedmsg, null, 2);
    console.log(err, fixedmsg);
}
addEventListener('error', (msg, url, line, col, error) => {
    throwError(msg);
});
