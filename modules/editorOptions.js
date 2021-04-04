const fluentFFMPEG = require('fluent-ffmpeg'),
    options = require('./rawEditorOptions.js'),
    shell = require('child_process').spawnSync;

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

    {
        let label = document.createElement('span');
        label.textContent = options.label;

        container.appendChild(label);
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

    elem.innerHTML = '';

    const basic = options.basic;

    for (let id in basic) {
        let type = basic[id].type;

        if (basic[id].parent !== null) 
            type = basic[basic[id].parent].type;

        type = type.toLowerCase();

        let html = createHTML(type, id, basic[id]);
        
        if (basic[id].small)
            html.classList.add('smaller');

        if (basic[id].parent !== null) {
            let bigcontainer = document.getElementById('basic_' + basic[id].parent).parentElement.parentElement;
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

    constructor(infile, outfile, ffDirs) {// path, path, [ffDir, ffmpegDir, ffprobeDir]
        this.audio = false;
        this.video = false;
        this.commands = [];
        this.ffDirs = ffDirs;
        this.fnames = [infile, outfile];
        
        this.commands.push(fluentFFMPEG());
    }

    getOutput() {
        return Object.assign({}, this.fnames[this.fnames.length - 1]);
    }

    getInput() {
        return Object.assign({}, this.fnames[this.fnames.length - 2]);
    }

    newCommand(fname, ffmpeg) {// path, fluentFFMPEG
        if (ffmpeg)
            this.commands[this.commands.length - 1] = ffmpeg;

        let newffmpeg = fluentFFMPEG();
        
        this.commands.push(newffmpeg);
        this.fnames.push(fname);

        return newffmpeg;
    }

    rawffmpeg(args) {// array
        return shell(this.ffDirs[1], args);
    }

    rawffprobe(args) {// array
        return shell(this.ffDirs[2], args);
    }

    command(f, val) {// function(fluentFFMPEG, video info + commands, input value), input value

        let info = genInfo();
        info.newCommand = (fname, ffmpeg) => this.newCommand(fname, ffmpeg);
        info.getOutput = () => this.getOutput();
        info.getInput = () => this.getInput();
        info.getOutputPath = () => path.format(this.getOutput());
        info.getInputPath = () => path.format(this.getInput());
        info.rawffmpeg = args => this.rawffmpeg(args);
        info.rawffprobe = args => this.rawffprobe(args);
        
        let ran = f(this.commands[this.commands.length - 1], info, val);

        if (ran instanceof fluentFFMPEG().constructor)
            this.commands[this.commands.length - 1] = ran;
        
    }

    finish(prePrepare) {

        let cmds = this.commands,
            fname = this.fnames;

        return new Promise((complete, fail) => {

            let prepared = [];

            const prepare = i => {
                cmds[i].input(path.format(fname[i])).output(path.format(fname[i+1]));

                if (typeof prePrepare === 'function')
                    prePrepare(cmds[i], i);
                
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
                if (cmds[i]._currentOutput.video.get('bitrate').length === 0 && cmds[i]._currentOutput.videoFilters.get().length === 0)
                    cmds[i].videoCodec('copy');
                if (cmds[i]._currentOutput.audio.get('bitrate').length === 0 && cmds[i]._currentOutput.audioFilters.get().length === 0)
                    cmds[i].audioCodec('copy');

                prepare(i);
                
            }

        });
    }

}

module.exports = {
    generate: data => generateOptions(data), //create html for options from rawEditorOptions.js
    finish: (videoSrc, runFFMPEG, ffDirs) => {

        var ffmpeg = new ffmpegWrapper(videoSrc, path.parse(`${videoSrc.dir}/${videoSrc.name}_edited${videoSrc.ext}`), ffDirs);

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

        runFFMPEG(ffmpeg);

        /*ffmpeg.finish().then(args => {

            console.log(args);

            runFFMPEG(args);

        }).catch(e => {
            throw e;
        });*/

    }
};