const fluentFFMPEG = require('fluent-ffmpeg'),
    path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf'),
    fsPromise = fs.promises,
    shell = require('child_process').spawnSync,
    options = require('./rawEditorOptions.js');

module.exports = settings => {

    var videoData = null,
        trimmedDuration = null; // will stay null until finish() is called form editor.js

    function randomChars(length) {
        let chars = '';
        for (let i = 0; i < length; i++)
            chars += String.fromCharCode(97 + Math.round(Math.random() * 25));
        return chars;
    }

    function copyFile(infile, outfile, i=0) {

        let outfileMod = Object.assign({}, outfile),
            suffix = '';

        if (i >= 10)
            suffix = randomChars(5);
        else if (i > 0)
            suffix += i;

        outfileMod.name += suffix;
        outfileMod.base = outfileMod.name + outfileMod.ext;

        if (fs.existsSync(path.format(outfileMod)))
            return copyFile(infile, outfileMod, i+1);

        return fsPromise.copyFile(path.format(infile), path.format(outfileMod));
        
    }

    function genInfo(uninitialized) {

        let ret = {
            data: videoData,
            duration: trimmedDuration,
            settings
        };

        if (!uninitialized) {

            ret.options = {
                basic: {},
                advanced: {}
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

    function getValue(val, strictType, args = []) {

        if (typeof val === 'function')
            val = val(...args, genInfo());
        
        if (strictType) {
            if (typeof strictType === 'object') {

                if (typeof val === 'object' && val.constructor === strictType.constructor)
                    return val;

            } else if (typeof val === typeof strictType)
                return val;

            return null;
        }

        return val;
        
    }

    function getValueNoOpt(val, strictType, args = []) {

        if (typeof val === 'function')
            val = val(...args, genInfo(true));

        if (strictType) {
            if (typeof strictType === 'object') {

                if (typeof val === 'object' && val.constructor === strictType.constructor)
                    return val;

            } else if (typeof val === typeof strictType)
                return val;

            return null;
        }

        return val;

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

            if (options.value)
                select.value = getValueNoOpt(options.value);

            if (typeof options.on === 'function')
                input.addEventListener('change', e => options.on(e.target, genInfo()));

            onUpdateValues(select);

            container.appendChild(select)

        }

        {
            let label = document.createElement('span');
            label.textContent = getValueNoOpt(options.label, '');

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

            if (getValueNoOpt(options.default))
                input.checked = true;

            if (typeof options.on === 'function')
                input.addEventListener('change', e => options.on(e.target, genInfo()));

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
            label.textContent = getValueNoOpt(options.label, '');

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

        constructor(infile, ffdirs, tempdir) {// path, path, [ffDir, ffmpegDir, ffprobeDir]
            this.audio = false;
            this.video = false;
            this.commands = [];
            this.ffdirs = ffdirs;
            this.tempdir = tempdir;
            this.temps = [];
        }
        
        genTemp(ext) {

            let genFname = () => {
                let chars = randomChars(20);
                if (fs.existsSync(path.join(this.tempdir, chars + ext)))
                    return genFname();
                return chars;
            };

            let tempfname = genFname();

            let ret = path.parse(path.join(this.tempdir, tempfname + ext));

            ret.isTemp = true;

            this.temps.push(ret);

            return ret;
        }

        clearTemp(single) {
            if (single)
                for (let i = 0; i < this.temps.length; i++) {
                    let p = path.format(this.temps[i])
                    if (fs.existsSync(p))
                        fs.unlinkSync(p);
                }
            else
                rimraf(this.tempdir, () => {});
        }

        newCommand(fname, ffmpeg) {// path, fluentFFMPEG
            if (ffmpeg) {
                this.commands.push(ffmpeg);
                this.fnames.push(fname);
            }

            return fluentFFMPEG();
        }

        rawffmpeg(args) {// array
            return shell(this.ffdirs[1], args);
        }

        rawffprobe(args) {// array
            return shell(this.ffdirs[2], args);
        }

        fullcommand(f, val, isfirst, islast, infname, tempdir, prePrepare, referencePath) {// function(fluentFFMPEG, video info + commands, input value), input value

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
                info.asNewFile = (outSuffix='_edited') => {
                    
                    if (infname.isTemp) {
                        //copy last one out
                        let copyLastfname = Object.assign({}, referencePath);
                        copyLastfname.name += '_edited';
                        copyLastfname.base = copyLastfname.name + copyLastfname.ext;

                        copyFile(infname, copyLastfname);
                    }

                    outfname = Object.assign({}, referencePath);
                    outfname.name += outSuffix;
                    outfname.base = outfname.name + outfname.ext;

                    return outfname;
                }; //outfname will be path.parse object

                let cmd = f(fluentFFMPEG(), info, val);

                //might deprecate in favor of info.asNewFile(outSuffix)
                if (cmd instanceof [].constructor)
                    [cmd, outfname] = cmd;

                if (cmd instanceof fluentFFMPEG().constructor) {

                    let tempfname = this.genTemp(infname.ext);

                    if (outfname === null) {
                        if (islast) {
                            outfname = Object.assign({}, referencePath);

                            outfname.name+= '_edited';
                            outfname.base = outfname.name + outfname.ext;
                        }// else
                            //outfname = this.genTemp(infname.ext);
                    }

                    if (cmd._complexFilters.get().length === 0) {
                        if (cmd._currentOutput.video.get('bitrate').length === 0 && cmd._currentOutput.videoFilters.get().length === 0)
                            cmd.videoCodec('copy');
                        if (cmd._currentOutput.audio.get('bitrate').length === 0 && cmd._currentOutput.audioFilters.get().length === 0)
                            cmd.audioCodec('copy');
                    }

                    //console.log('in', infname, path.format(infname));
                    //console.log('out', outfname, path.format(outfname));

                    cmd.input(path.format(infname)).output(path.format(tempfname));

                    if (typeof prePrepare === 'function')
                        prePrepare(cmd, isfirst, islast);

                    cmd._prepare(function (err, args) {
                        if (err)
                            fail(err);
                        else
                            complete([args, tempfname, outfname]);
                    });

                }

            });

        }

    }

    return {
        generate: data => generateOptions(data), //create html for options from rawEditorOptions.js
        finish: (videoSrc, tmpDir, runFFMPEG, ffdirs, trimmedDur) => {
            trimmedDuration = trimmedDur;

            //var ffmpeg = new ffmpegWrapper(videoSrc, path.parse(`${videoSrc.dir}/${videoSrc.name}_edited${videoSrc.ext}`), ffdirs);
            var ffmpeg = new ffmpegWrapper(videoSrc, ffdirs, tmpDir),
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

                    let args = [i === 0, i === allRunFuncs.length - 1, infname, tmpDir, runFFMPEG.prePrepare, lastNontempPath];

                    ffmpeg.fullcommand(...allRunFuncs[i], ...args).then(([args, tempfname, outfname]) => {
                        runFFMPEG(args).then(cancelled => {
                            if (!cancelled) {
                                if (outfname !== null)
                                    copyFile(tempfname, outfname);
                                eachOption(i + 1, tempfname);
                            } else {
                                runFFMPEG.finish();
                                ffmpeg.clearTemp();
                            }
                        }).catch(err => {
                            ffmpeg.clearTemp();
                            throw err;
                        });
                    }).catch(err => {
                        ffmpeg.clearTemp();
                        throw err;
                    });
                } else {
                    runFFMPEG.finish();
                    ffmpeg.clearTemp();
                }
            };

            eachOption(0, videoSrc);

        }
    }
};