const fluentFFMPEG = require('fluent-ffmpeg'),
    options = require('./rawEditorOptions.js'),
    EventEmitter = require('events');

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
            val = null,
            type = options.basic[id].type;

        if (options.basic[id].parent !== null)
            type = options.basic[options.basic[id].parent].type;

        switch (type) {
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

    //update visibilities and diableds

    for (let id in options.basic) {
        let { dynamic } = options.basic[id],
            elem = document.getElementById('basic_' + id);

        if (dynamic.visibility !== null && ['boolean', 'function'].includes(typeof dynamic.visibility)) {
            let val = true;
            if (typeof dynamic.visibility === 'function')
                val = !dynamic.visibility(info);
            else
                val = !dynamic.visibility;

            if (val)
                elem.parentElement.parentElement.setAttribute('hidden', '')
            else
                elem.parentElement.parentElement.removeAttribute('hidden');
        }

        if (dynamic.enabled !== null && ['boolean', 'function'].includes(typeof dynamic.enabled)) {
            let val = true;
            if (typeof dynamic.enabled === 'function')
                val = !dynamic.enabled(info);
            else
                val = !dynamic.enabled;

            if (val)
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

        onUpdateValues(input);

        container.appendChild(input);
    }

    {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 21 21');

        let polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '5 10.75 8.5 14.25 16 6');

        svg.appendChild(polyline);

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

    for (let id in basic) {
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

//custom fluentFFMPEG wrapper
class ffmpegWrapper {

    constructor(infile, outfile) {// path, path
        this.audio = false;
        this.video = false;
        this.commands = [];
        this.fnames = [infile, outfile];
        
        //this.commands.push(fluentFFMPEG(path.format(infile)).output(path.format(outfile)));
        this.commands.push(fluentFFMPEG());
    }

    getOutput() {
        return Object.assign({}, this.fnames[this.fnames.length - 1]);
    }

    newCommand(fname, ffmpeg) {// path, fluentFFMPEG
        if (ffmpeg)
            this.commands[this.commands.length - 1] = ffmpeg;
        
        //this.commands.push(fluentFFMPEG(path.format(this.getOutput())).output(path.format(fname)));
        this.commands.push(fluentFFMPEG());
        this.fnames.push(fname);
    }

    command(f, val) {// function(fluentFFMPEG, video info + commands, input value)

        let info = genInfo();
        info.newCommand = (fname, ffmpeg) => this.newCommand(fname, ffmpeg);
        info.getOutput = () => this.getOutput();
        
        let ran = f(this.commands[this.commands.length - 1], info, val);

        if (ran instanceof fluentFFMPEG().constructor)
            this.commands[this.commands.length - 1] = ran;
        
    }

    finish() {

        let cmds = this.commands,
            fname = this.fnames;

        return new Promise((complete, fail) => {

            let prepared = [];

            const prepare = i => {
                cmds[i].input(path.format(fname[i])).output(path.format(fname[i+1]));
                cmds[i]._prepare(function (err, args) {
                    if (err)
                        fail(err);
                    else {
                        prepared[i] = args;
                        if (prepared.filter(p=>p).length === cmds.length)
                            complete(prepared);
                    }
                });
            }

            for (let i = 0; i < cmds.length; i++) {
                if (cmds[i]._currentOutput.video.get('bitrate').length === 0)
                    cmds[i].videoCodec('copy');
                if (cmds[i]._currentOutput.audio.get('bitrate').length === 0)
                    cmds[i].audioCodec('copy');

                prepare(i);
                
            }

        });
    }

}

module.exports = {
    generate: data => generateOptions(data), //create html for options from rawEditorOptions.js
    finish: videoSrc => {

        var ffmpeg = new ffmpegWrapper(videoSrc, path.parse(`${videoSrc.dir}/${videoSrc.name}_edited${videoSrc.ext}`));

        for (let id in options.basic) {
            let { dynamic } = options.basic[id],
                elem = document.getElementById('basic_' + id),
                val = null,
                shouldrun = true;

            switch (options.basic[id].type) {
                case 'checkbox':
                    val = elem.checked;
                    break;
                case 'dropdown':
                    val = elem.value;
            }

            if (dynamic.visibility !== null && ['boolean', 'function'].includes(typeof dynamic.visibility)) {
                let val = true;
                if (typeof dynamic.visibility === 'function')
                    val = dynamic.visibility(genInfo());
                else
                    val = dynamic.visibility;

                shouldrun = shouldrun && val;
            }

            if (dynamic.enabled !== null && ['boolean', 'function'].includes(typeof dynamic.enabled)) {
                let val = true;
                if (typeof dynamic.enabled === 'function')
                    val = dynamic.enabled(genInfo());
                else
                    val = dynamic.enabled;

                shouldrun = shouldrun && val;
            }

            if (shouldrun && options.basic[id].run !== null)
                ffmpeg.command(options.basic[id].run, val);

        }

        ffmpeg.finish().then(args => {

            console.log(args);

            //run ffmpeg

        }).catch(e => {
            throw e;
        });

    }
};