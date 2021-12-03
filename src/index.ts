//basic variables
import { ipcRenderer, webFrame, remote} from 'electron';
const { nativeTheme } = remote;
import mimeDB from 'mime-db';
import mime from 'mime';
const getMimeType = (str: string) => mime.getType(str) || ''; //mime.getType() return null if no result, empty string is easier for my usage
import fs from 'fs';
import path from 'path';
import shell from 'child_process';
import rimraf from 'rimraf';
const Version = require('../package.json').version;
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { AudioStream, EmptyFFProbeStream, EmptyFileData, FFProbe, FFProbeStream, Settings, StreamsData, VideoStream } from './types';
import editor from './modules/editor';
import { getElementById, querySelector, querySelectorAll } from './modules/getElem';

function fixThemeStr(str: string): "system"|"dark"|"light" {
    if (str === "system" || str === "dark" || str === "light")
        return str;
    else
        return "system"
}

var settings: Settings,
    appDataPath: string, ffDir: string, ffmpegDir: string, ffprobeDir: string, settingsPath: string;

//easy round functions
const round = (num: number, closest=1) => Math.round(num/closest)*closest;
round.ceil = (num: number, closest=1) => Math.ceil(num/closest)*closest;
round.floor = (num: number, closest=1) => Math.floor(num/closest)*closest;

//number mapping
// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
const mapNumber = (num: number, in_min: number, in_max: number, out_min: number, out_max: number) =>
    (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;

//prevent zooming
webFrame.setVisualZoomLevelLimits(1, 1);

var gotData = false,
    domLoaded = false;

//on ffmpeg downloaded
ipcRenderer.on('data', (event, data) => {
    
    appDataPath = data;
    
    gotData = true;

    if (domLoaded)
        main();

});
ipcRenderer.send('getData');

addEventListener('load', () => {

    domLoaded = true;

    if (gotData)
        main();

});


var blockFile = true; //should block file from being dragged over

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

function main() {

    //ffmpeg binaries https://ffbinaries.com/downloads
    ffDir = path.join(appDataPath, 'ffmpeg-binaries');
    ffmpegDir = path.join(ffDir, 'ffmpeg');
    ffprobeDir = path.join(ffDir, 'ffprobe');
    settingsPath = path.join(appDataPath, 'storage');

    //in case an error happened in main.js
    if (!fs.existsSync(ffDir))
        ipcRenderer.send('exit', 'OS IS NOT SET UP');

    if (!fs.existsSync(settingsPath))
        fs.mkdirSync(settingsPath);

    //settingsOrig.setDataPath(path.join(ffDir, 'storage'));

    //using a proxy so settings can easily be saved as they're written to
    let settingsProxy = {
        get(_: any, prop: string) {
            if (!fs.existsSync(path.join(settingsPath, prop + '.json')))
                return undefined;

            try {
                return JSON.parse(fs.readFileSync(path.join(settingsPath, prop + '.json')).toString());
            } catch (e) {
                return undefined;
            }
        },
        set(_: any, prop: string, value: any): boolean {
            try {
                fs.writeFileSync(path.join(settingsPath, prop + '.json'), JSON.stringify(value));
                return true;
            } catch(e) {
                console.error(e);
                return false;
            }
        }
    };
    settings = new Proxy({}, settingsProxy);

    /*if (settings.autoupdate === undefined)
        settings.autoupdate = true;*/
    if (settings.theme === undefined)
        settings.theme = 'system';
    if (settings.dyslexic === undefined)
        settings.dyslexic = false;

    //aaaaaah
    ffmpeg.setFfmpegPath(ffmpegDir);

    document.body.classList.remove('loadingMain');
    blockFile = false;

    //declarations outside of page scope
    const videoEditor = editor(querySelector('#editor video') as HTMLVideoElement, () => {
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
    {
        let elem = getElementById('version');
        if (elem)
            elem.textContent = Version;
    }

    //settings button
    getElementById('settingsButton').addEventListener('click', () => document.body.classList.add('settings'), false);

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
                        getElementById('version').classList.add('update');
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
    var videoExts = Object.keys(mimeDB).filter(m=>m.startsWith('video/'));
    getElementById('fileupload').setAttribute('accept', videoExts.join(','));

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
        if (!blockFile && e.dataTransfer)
            handleFiles(e.dataTransfer.files);
    }, false);
    getElementById('fileupload').addEventListener('change', function () {
        if (!blockFile)
            handleFiles((this as HTMLInputElement).files);
    }, false);

    //handle file input
    function handleFiles(filesRaw: FileList | null) {

        if (filesRaw === null)
            return;

        document.body.setAttribute('class', 'processing');

        getElementById('editsprogress').classList.remove('finished');

        console.log(filesRaw);

        let files = Array.from(filesRaw).filter(f => getMimeType(f.path).split('/')[0] === 'video');

        if (files.length) {
            videoEditor.open();
            videoEditor.onload(editorScaleDo);
            processVideo(files[0]);
        } else
            document.body.removeAttribute('class');
    }

    /* settings */

    //auto update
    /*getElementById('autoupdatetoggle').checked = settings.autoupdate;
    getElementById('autoupdatetoggle').addEventListener('change', e => {
        settings.autoupdate = e.target.checked;
    }, false);*/

    //theme
    {
        try {
            nativeTheme.themeSource = settings.theme;
        } catch (e) {
            settings.theme = 'system';
            nativeTheme.themeSource = settings.theme;
        }

        let elem = getElementById('themeselect') as HTMLInputElement;
        if (elem) {
            elem.value = settings.theme;
            elem.addEventListener('change', e => {
                document.body.setAttribute('theme', elem.value);
                settings.theme = fixThemeStr(elem.value);
                nativeTheme.themeSource = settings.theme;
            }, false);
        }
    }

    updateTheme();
    nativeTheme.on('updated', updateTheme);

    //dyslexia
    {
        if (settings.dyslexic)
            document.body.setAttribute('dyslexic', '');
        else
            document.body.removeAttribute('dyslexic');

        let elem = getElementById('dyslexictoggle') as HTMLInputElement;
        elem.checked = settings.dyslexic;
        elem.addEventListener('change', e => {
            if (elem.checked)
                document.body.setAttribute('dyslexic', '');
            else
                document.body.removeAttribute('dyslexic');
            settings.dyslexic = elem.checked;
        }, false);
    }

    getElementById('deleteall').addEventListener('click', () => {
        document.body.classList.remove('settings');
        document.body.classList.add('loadingMain');

        setTimeout(() => {
            rimraf.sync(ffDir);
            remote.getCurrentWindow().close();
        }, 200);
    }, false);

    getElementById('closeSettings').addEventListener('click', () => document.body.classList.remove('settings'), false);

    /* processing video */

    //ffprobe file and process the data
    function processVideo(file: File) {

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
            let data = JSON.parse(output) as FFProbe;
            console.log(data);

            displayEditor(file, data);
        });

    }

    //function to create an object of each stream's data
    function getStreamsData(streams: FFProbeStream[] = []) {
        
        let ret: StreamsData = {
            video: [],
            audio: [],
            subtitles: [],
            other: [],
            primary: {
                video: getStreamData('video') as VideoStream,
                audio: getStreamData('audio') as AudioStream
            }
        };

        for (let i = 0; i < streams.length; i++) {
            let codec = streams[i].codec_type;
            switch (codec) {
                case 'video':
                    ret.video.push(getStreamData('video', streams[i]) as VideoStream);
                    break;
                case 'audio':
                    ret.audio.push(getStreamData('audio', streams[i]) as AudioStream);
                    break;
                case 'subtitles':
                    ret.subtitles.push(getStreamData('subtitles', streams[i]) as FFProbeStream);
                    break;
                default:
                    ret.other.push(streams[i] as FFProbeStream);
                    break;
            }
        }

        if (ret.video.length)
            ret.primary.video = ret.video[0];
        if (ret.audio.length)
            ret.primary.audio = ret.audio[0];

        return ret;
    }

    //function to create an objecy of video data

    function getStreamData(type: string, stream?: FFProbeStream): FFProbeStream|VideoStream|AudioStream {
        
        if (!stream)
            stream = EmptyFFProbeStream();

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
                    duration: parseFloat(stream.duration)
                } as VideoStream;
            case 'audio':
                return {
                    bitrate: parseInt(stream.bit_rate),
                    codecLong: stream.codec_long_name,
                    codec: stream.codec_name,
                    duration: parseFloat(stream.duration)
                } as AudioStream;
            case 'subtitles':
            case 'other':
            default:
                return stream;
        }
    }

    /* editing page */

    //null data so functions will not error before the data is filled out
    var data = EmptyFileData();

    //take data and display the editor
    function displayEditor(file: File, rawdata: FFProbe) {

        data = {
            bitrate: parseInt(rawdata.format.bit_rate),
            duration: parseFloat(rawdata.format.duration),
            format: rawdata.format.format_name_long,
            filename: rawdata.format.filename,
            streams: getStreamsData(rawdata.streams),
            path: path.parse(file.path)
        };

        console.log(data);

        querySelectorAll('#quickoptions input').forEach(input => {
            let attr = input.getAttribute('a:channels');
            if (input.hasAttribute('a:channels') && attr && parseInt(attr) !== data.streams.audio.length)
                input.parentElement?.classList.add('disabled');
            else
                input.parentElement?.classList.remove('disabled');
        });

        videoEditor.src(data);

    }

    //finish button
    querySelector('#finish .button')?.addEventListener('click', finishButton);
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

        let elemEditor = getElementById('editor'),
            elemEditorInner = getElementById('editor');

        let height = parseFloat(getComputedStyle(getElementById('editorInner')).height)
            + parseFloat(getComputedStyle(getElementById('editor')).padding) * 2;

        if (innerHeight < height) {
            editorScale = innerHeight / height;
            getElementById('editor').style.transform = `scale(${editorScale}, ${editorScale})`;
        } else
            getElementById('editor').style.transform = `scale(1, 1)`;
    };
    addEventListener('resize', editorScaleDo);
    addEventListener('click', () => setTimeout(editorScaleDo, 10));

    /* loading edits */

    /*
     * https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020605.html
     * ffmpeg outputs data to stderr
     */

    //this has no error handling (must be done by parsing output)
    function runffmpegEachCommand(command: string[], startpercent: number, endpercent: number, part: number, totalpart: number) {

        querySelector('#progress .progresstext .part').textContent = `${part}/${totalpart}`;
        if (startpercent === 0) {
            querySelector('#progress .progressbar .progressinner').style.width = '30px';
            querySelector('#progress .progresstext .eta').textContent = 'calculating';
        }

        //command is array of args

        return new Promise((complete, error) => {

            //run the command
            let ffmpegShell = shell.spawn(ffmpegDir, command);
            console.log(command);

            //basic data stored that shouldn't be recalculated everytime ffmpeg outputs data
            let preOutput = querySelector('#consoleoutput pre'),
                frameCount: number = Math.floor(videoEditor.data().duration / (1 / data.streams.primary.video.framerate)),
                timeAvgs: number[] = [],
                lastTime: number|null = null,
                lastFrame: number = 0;


            //on ffmpeg data output
            ffmpegShell.stderr.on('data', stdout => {

                stdout = stdout.toString();

                //if it's already scrolled to the bottom then keep it scrolled to the bottom
                let toScroll = Math.abs(querySelector('#consoleoutput pre').scrollTop - (querySelector('#consoleoutput pre').scrollHeight - querySelector('#consoleoutput pre').getBoundingClientRect().height)) < 25;

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
                        timeRemaining: number|null = null;

                    if (lastTime === null) {
                        lastTime = Date.now();
                        lastFrame = currentFrame;
                    } else {
                        timeAvgs.push((Date.now() - lastTime) / (currentFrame - lastFrame));

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
                    let minpercent = (querySelector('#progress .progressbar').getBoundingClientRect().width - 10) / 30 / 100;

                    vidualpercent = mapNumber(vidualpercent, 0, 1, minpercent, 1);

                    querySelector('#progress .progressbar .progressinner').style.width = round(vidualpercent * 100, .01) + '%';

                    querySelector('#progress .progresstext .part').textContent = `${part}/${totalpart}`;
                    querySelector('#progress .progresstext .eta').textContent = timeRemaining === null ? 'calculating' : timeRemaining.toString();

                }

            });

            //cancel button
            let cancelled = false;
            let cancelButton = () => {
                ffmpegShell.kill('SIGINT');
                cancelled = true;
            };
            getElementById('returncancel').addEventListener('click', cancelButton);

            //on ffmpeg done
            ffmpegShell.on('close', code => {
                console.log(`child process exited with code ${code}`);

                //disable cancel button
                getElementById('returncancel').removeEventListener('click', cancelButton);

                //recurse if there's another command, otherwise return
                complete(cancelled);
            });

        });
    }

    function runffmpegEach(total: number): (args: string[]) => Promise<null> {

        blockFile = true;

        let current = 0,
            eachPercent = 1 / total;

        function eachCommand(args: string[]): Promise<null> {
            return new Promise((complete, error) => {

                runffmpegEachCommand(args, eachPercent * current, eachPercent * (current + 1), current + 1, total).then(() => {
                    complete(null);
                }).catch(err => {
                    document.body.classList.remove('editsprogress');
                    error(err);
                });

                current++;

            });
        }

        eachCommand.finish = () => {
            querySelector('#progress .progressbar .progressinner').style.width = '';
            getElementById('editsprogress').classList.add('finished');
            blockFile = false;
        };

        //prePrepare(cmd, isfirst, islast);
        eachCommand.prePrepare = (command: FfmpegCommand, isfirst: boolean, islast: boolean) => {
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
    getElementById('returndone').addEventListener('click', () => {
        document.body.classList.remove('editsprogress');
    });

    /* error */

    //open dev tools button
    querySelector('#error .small').addEventListener('click', () => {
        ipcRenderer.send('devtools');
    });

    //select entire error on click
    querySelector('#errordisplay pre').addEventListener('click', () => {
        var range = document.createRange();
        range.selectNode(querySelector('#errordisplay pre'));
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
    });

}

//the error object is dumb and will not JSON.stringify correctly
function jsonifyerror(msg: any) {
    let obj: any = {};
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
function throwError(err: any) {
    let fixedmsg = jsonifyerror(err);
    document.body.classList.add('error');
    querySelector('#errordisplay pre').textContent = JSON.stringify(fixedmsg, null, 2);
    console.log(err, fixedmsg);
}
addEventListener('error', msg => {
    throwError(msg);
});
