const fluentFFMPEG = require('fluent-ffmpeg'),
    options = require('./rawEditorOptions.js');

var videoData = null;

function genInfo() {

    let ret = {
        data: videoData,
        options: {
            basic: {},
            advanced: {}
        }
    };

    for (let id in options.basic) {
        let elem = document.getElementById('basic_' + id),
            val = null;

        switch (options.basic[id].type) {
            case 'checkbox':
                val = elem.checked;
                break;
            case 'dropdown':
                val = elem.value;
        }

        ret.options.basic[id] = val;
    }

    return ret;

}

function updateValues() {
    let info = genInfo();

    console.log(info);

    //update visibilities and diableds

    for (let id in options.basic) {
        let { dynamic } = options.basic[id],
            elem = document.getElementById('basic_' + id);

        if (dynamic.visibility !== null) {
            if (!dynamic.visibility(info))
                elem.setAttribute('hidden', '')
            else
                elem.removeAttribute('hidden');
        }

        if (dynamic.enabled !== null) {
            if (!dynamic.enabled(info))
                elem.setAttribute('disabled', '')
            else
                elem.removeAttribute('disabled');
        }

    }
}

function onUpdateValues(elem) {
    elem.addEventListener('change', updateValues);
}

function createDropdown(id, options) {

    let container = document.createElement('label');

    {
        let label = document.createElement('span');
        label.textContent = options.label;

        container.appendChild(label);
    }

    {
        let select = document.createElement('select');
        select.setAttribute('id', 'basic_' + id);

        for (let option of options.dropdown) {
            let opt = document.createElement('option');
            opt.setAttribute('value', option[0]);
            opt.textContent = option[1];

            select.appendChild(opt);
        }

        select.value = options.value;

        onUpdateValues(select);

        container.appendChild(select)

    }

    return container;

}

function createCheckbox(id, options) {

    let container = document.createElement('label');

    {
        let input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('id', 'basic_' + id);

        if (!options.visibility)
            input.setAttribute('hidden', '');

        if (!options.enabled)
            input.setAttribute('disabled', '');

        onUpdateValues(input);

        container.appendChild(input);
    }

    {
        let svg = document.createElement('svg');
        svg.setAttribute('viewBox', '0 0 21 21');
        svg.innerHTML = '<polyline points="5 10.75 8.5 14.25 16 6"></polyline>';

        container.appendChild(svg);
    }

    {
        let label = document.createElement('span');
        label.textContent = options.label;

        container.appendChild(label);
    }

    return container;

}

function createHTML(type, id, options) {

    switch(type) {
        case 'checkbox':
            return createCheckbox(id, options);
        case 'dropdown':
            return createDropdown(id, options);
    }

}

function generateOptions(data) {

    videoData = data;

    const elem = document.getElementById('quickoptions');

    const basic = options.basic;

    console.log(basic);
    for (let id in basic) {
        console.log(id);
        let type = basic[id].type;

        if (basic[id].parent !== null) 
            type = basic[basic[id].parent].type;

        type = type.toLowerCase();

        let html = createHTML(type, id, basic[id]);

        if (basic[id].parent !== null) {
            let bigcontainer = document.getElementById('basic_' + basic[id].parent).parentElement.parentElement;
            html.classList.add('smaller');
            bigcontainer.appendChild(html);
        } else {
            let bigcontainer = document.createElement('div');
            bigcontainer.classList.add(type);
            bigcontainer.appendChild(html);
            elem.appendChild(bigcontainer);
        }
    }

    updateValues();
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
    generate: data => generateOptions(data), //create html for options from rawEditorOptions.js
    finish: () => {}
};