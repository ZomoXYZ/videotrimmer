const fluentFFMPEG = require('fluent-ffmpeg'),
    options = require('./rawEditorOptions.js');

function createHTML() {
    
}

function generateOptions() {

    const basicoptions = options.basic;

        `<div class="checkbox">
                    <label>
                        <input type="checkbox" id="fixmic" a:channels="2">
                        <svg viewBox="0 0 21 21">
                            <polyline points="5 10.75 8.5 14.25 16 6"></polyline>
                        </svg>
                        <span>Fix Mic and Combine Audio</span>
                    </label>
                </div>`
}

//custom ffmpeg class
class ffmpeg {
    audio = false;
    video = false;
    commands = [];

    constructor(fname) {
        this.fname = fnmame;
    }
    /*
    fname = {
        name: "abcd",
        ext: "mp4"
    }
    */

    newCommand() {
        this.commands.push(fluentFFMPEG())//require('fluent-ffmpeg')('%in%').output('%out%'));
        return this.commands.length - 1;
    }

    command(i, f) {
        this.commands[i] = f(this.commands[i]);
    }
    /*
    .command(1, ffmpeg => ffmpeg.videoBitrate('500k'))
    */

    finish() {
        return new Promise((complete, fail) => {

            for (let i = 0; i < this.commands.length; i++) {
                if (this.commands[i]._currentOutput.video.get('bitrate').length === 0)
                    this.commands[i].videoCodec('copy');
                if (this.commands[i]._currentOutput.audio.get('bitrate').length === 0)
                    this.commands[i].audioCodec('copy');
            }

            ret.command._prepare(function (err, args) {
                if (err)
                    fail(err);
                else
                    complete(args);
            });

        });
    }

}

module.exports = {
    generate: () => generateOptions() //create html for options from rawEditorOptions.js
};