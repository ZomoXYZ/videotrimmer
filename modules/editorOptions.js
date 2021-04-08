const fluentFFMPEG = require('fluent-ffmpeg'),
    path = require('path'),
    fs = require('fs'),
    shell = require('child_process').spawnSync,
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

    constructor(infile, ffDirs) {// path, path, [ffDir, ffmpegDir, ffprobeDir]
        this.audio = false;
        this.video = false;
        this.commands = [];
        this.ffDirs = ffDirs;
        this.temps = [];
    }

    genTemp(ext) {
        
        let tempdir = path.join(this.ffDirs[0], 'temp');

        if (!fs.existsSync(tempdir))
            fs.mkdirSync(tempdir);

        if (!fs.lstatSync(tempdir).isDirectory()) {
            fs.unlinkSync(tempdir);
            fs.mkdirSync(tempdir);
        }

        let genFname = () => {
            let chars = '';
            for (let i = 0; i < 20; i++)
                chars += String.fromCharCode(97 + Math.round(Math.random()*25));
            if (fs.existsSync(path.join(tempdir, chars+ext)))
                return genFname();
            return chars;
        };

        let tempfname = genFname();

        let ret = path.parse(path.join(tempdir, tempfname + ext));

        ret.isTemp = true;

        this.temps.push(ret);

        return ret;
    }

    clearTemp() {
        for (let i = 0; i < this.temps.length; i++) {
            let p = path.format(this.temps[i])
            if (fs.existsSync(p))
                fs.unlinkSync(p);
        }
    }

    newCommand(fname, ffmpeg) {// path, fluentFFMPEG
        if (ffmpeg) {
            this.commands.push(ffmpeg);
            this.fnames.push(fname);
        }

        return fluentFFMPEG();
    }

    rawffmpeg(args) {// array
        return shell(this.ffDirs[1], args);
    }

    rawffprobe(args) {// array
        return shell(this.ffDirs[2], args);
    }

    command(f, val) {// function(fluentFFMPEG, video info + commands, input value), input value

        //console.log('input', this.getInput(), 'output', this.getOutput(), this.fnames);

        let info = genInfo();
        info.newCommand = (fname, ffmpeg) => this.newCommand(fname, ffmpeg);
        info.getOutput = fnameSuffix => this.getOutput(fnameSuffix);
        info.getOutputPath = fnameSuffix => path.format(this.getOutput(fnameSuffix));
        info.getInput = () => this.getInput();
        info.getInputPath = () => path.format(this.getInput());
        info.rawffmpeg = args => this.rawffmpeg(args);
        info.rawffprobe = args => this.rawffprobe(args);
        
        /*let ran = f(this.commands[this.commands.length - 1], info, val);

        if (ran instanceof fluentFFMPEG().constructor)
            this.commands[this.commands.length - 1] = ran;*/

        let ran = f(fluentFFMPEG(), info, val),
            fname = null;
        
        if (ran instanceof [].constructor)
            [ran, fname] = ran;
        
        if (ran instanceof fluentFFMPEG().constructor) {
            this.commands.push(ran);
            this.fnames.push(fname);
        }
        
    }

    finish(prePrepare) {

        let cmds = this.commands,
            fnames = [],
            curExt = this.fnames[0].ext;

        let lastOutput = this.fnames[0];
        for (let i = 0; i < cmds.length; i++) {
            let outName = this.fnames[i + 1];
            //in lastOutput
            //out outName

            console.log('pre', [lastOutput, outName])

            if (outName === null) {
                if (i === cmds.length - 1) {
                    outName = this.getOutput('_edited', i);

                } else
                    outName = this.genTemp(curExt);
            } else
                curExt = outName.ext;

            console.log('post', [lastOutput, outName])
            
            fnames.push([path.format(lastOutput), path.format(outName)]);

            lastOutput = outName;

        }

        console.log(fnames);

        return new Promise((complete, fail) => {

            let prepared = [];

            const prepare = i => {
                cmds[i].input(fnames[i][0]).output(fnames[i][1]);

                if (typeof prePrepare === 'function')
                    prePrepare(cmds[i], i);
                
                cmds[i]._prepare(function (err, args) {
                    if (err)
                        fail(err);
                    else {
                        prepared[i] = args;
                        if (prepared.filter(p=>p).length === cmds.length) {
                            console.log(cmds);
                            complete(prepared);
                        }
                    }
                });
            }

            for (let i = 0; i < cmds.length; i++) {
                if (cmds[i]._complexFilters.get().length === 0) {
                    if (cmds[i]._currentOutput.video.get('bitrate').length === 0 && cmds[i]._currentOutput.videoFilters.get().length === 0)
                        cmds[i].videoCodec('copy');
                    if (cmds[i]._currentOutput.audio.get('bitrate').length === 0 && cmds[i]._currentOutput.audioFilters.get().length === 0)
                        cmds[i].audioCodec('copy');
                }

                prepare(i);
                
            }

        });
    }

    fullcommand(f, val, isfirst, islast, infname, prePrepare, referencePath) {// function(fluentFFMPEG, video info + commands, input value), input value

        return new Promise((complete, fail) => {

            //console.log('input', this.getInput(), 'output', this.getOutput(), this.fnames);

            let outfname = null;

            let info = genInfo();
            //info.newCommand = (fname, ffmpeg) => this.newCommand(fname, ffmpeg);
            /*info.getOutput = fnameSuffix => this.getOutput(fnameSuffix);
            info.getOutputPath = fnameSuffix => path.format(this.getOutput(fnameSuffix));*/
            info.getInput = () => Object.assign({}, infname);
            info.getInputPath = () => path.format(info.getInput());
            info.rawffmpeg = args => this.rawffmpeg(args);
            info.rawffprobe = args => this.rawffprobe(args);
            info.asNewFile = outSuffix => {
                let outfname = Object.assign({}, referencePath);
                outfname.name += outSuffix;
                outfname.base = outfname.name + outfname.ext;
                return outfname;
            }; //outfname will be path.parse object

            let cmd = f(fluentFFMPEG(), info, val);

            //might deprecate in favor of info.asNewFile(outSuffix)
            if (cmd instanceof [].constructor)
                [cmd, outfname] = cmd;

            if (cmd instanceof fluentFFMPEG().constructor) {

                if (outfname === null) {
                    if (islast) {
                        outfname = Object.assign({}, referencePath);

                        outfname.name+= '_edited';
                        outfname.base = outfname.name + outfname.ext;
                    } else
                        outfname = this.genTemp(infname.ext);
                }

                if (cmd._complexFilters.get().length === 0) {
                    if (cmd._currentOutput.video.get('bitrate').length === 0 && cmd._currentOutput.videoFilters.get().length === 0)
                        cmd.videoCodec('copy');
                    if (cmd._currentOutput.audio.get('bitrate').length === 0 && cmd._currentOutput.audioFilters.get().length === 0)
                        cmd.audioCodec('copy');
                }

                console.log('in', infname, path.format(infname));
                console.log('out', outfname, path.format(outfname));

                cmd.input(path.format(infname)).output(path.format(outfname));

                if (typeof prePrepare === 'function')
                    prePrepare(cmd, isfirst, islast);

                cmd._prepare(function (err, args) {
                    if (err)
                        fail(err);
                    else {
                        console.log(args);
                        complete([args, outfname]);
                    }
                });

            }

        });

    }

}

module.exports = {
    generate: data => generateOptions(data), //create html for options from rawEditorOptions.js
    finish: (videoSrc, runFFMPEG, ffDirs) => {

        //var ffmpeg = new ffmpegWrapper(videoSrc, path.parse(`${videoSrc.dir}/${videoSrc.name}_edited${videoSrc.ext}`), ffDirs);
        var ffmpeg = new ffmpegWrapper(videoSrc, ffDirs),
            allRunFuncs = [];

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
                let curval = true;
                if (typeof dynamic.visibility === 'function')
                    curval = dynamic.visibility(genInfo());
                else
                    curval = dynamic.visibility;

                shouldrun = shouldrun && curval;
            }

            if (dynamic.enabled !== null && ['boolean', 'function'].includes(typeof dynamic.enabled)) {
                let curval = true;
                if (typeof dynamic.enabled === 'function')
                    curval = dynamic.enabled(genInfo());
                else
                    curval = dynamic.enabled;

                shouldrun = shouldrun && curval;
            }

            if (shouldrun && options.basic[id].run !== null)
                allRunFuncs.push([options.basic[id].run, val]);

        }

        runFFMPEG = runFFMPEG(allRunFuncs.length);

        let lastNontempPath = null;

        const eachOption = (i, infname) => {
            if (i < allRunFuncs.length && typeof allRunFuncs[i] === 'object') {

                console.log('infname', infname);

                if (lastNontempPath === null || (infname && !infname.isTemp))
                    lastNontempPath = infname;

                let args = [i === 0, i === allRunFuncs.length - 1, infname, runFFMPEG.prePrepare, lastNontempPath];

                ffmpeg.fullcommand(...allRunFuncs[i], ...args).then(([args, outfname]) => {
                    runFFMPEG(args).then(cancelled => {
                        if (!cancelled)
                            eachOption(i + 1, outfname);
                        else
                            runFFMPEG.finish();
                    }).catch(err => {
                        throw err;
                    });
                }).catch(err => {
                    throw err;
                });
            } else
                runFFMPEG.finish();
        };

        eachOption(0, videoSrc);

        /*for (let id in options.basic) {
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
                //fullcommand(f, val, runffmpeg, infname, islast)

        }

        runFFMPEG(ffmpeg);*/

        /*ffmpeg.finish().then(args => {

            console.log(args);

            runFFMPEG(args);

        }).catch(e => {
            throw e;
        });*/

    }
};