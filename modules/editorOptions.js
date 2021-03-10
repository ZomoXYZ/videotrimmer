const fluentFFMPEG = require('fluent-ffmpeg'),
    options = require('./rawEditorOptions.js');

function updateValues() {

}

function createCheckbox(id, options) {

    let container = document.createElement('label');

    let input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', id);

    container.appendChild(input);

    let svg = document.createElement('svg');
    svg.setAttribute('viewBox', '0 0 21 21');
    svg.innerHTML = '<polyline points="5 10.75 8.5 14.25 16 6"></polyline>';

    container.appendChild(input);

    let label = document.createElement('span');
    label.textContent = options.container;

    container.appendChild(label);

    return container;

}

function createHTML(type, id, options) {

    switch(type) {
        case 'checkbox':
            return createCheckbox(id, options);
        case 'dropdown':
            return null;
    }

}

function generateOptions() {

    const elem = document.getElementById('quickoptions');

    const basic = options.basic;

    for (let id of basic) {
        let type = options.type;

        if (options.parent !== null)
            type = allOptions[options.parent].type;

        let html = createHTML(type, id, basic[id]);

        if (options.parent !== null) {
            //find parent and append
        } else {
            let bigcontainer = document.createElement('div');
            bigcontainer.classList.add(type);
            elem.appendChild(bigcontainer);
        }
    }
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