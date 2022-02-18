import { editorInfo, editorInfoBase, FfmpegCommandExt, FileData, ParsedPath, PathParsedExt, Settings } from "../types";
import path from 'path';
import fs from 'fs';
import fluentFFMPEG, { FfmpegCommand } from 'fluent-ffmpeg';
import { spawnSync as shell } from 'child_process';
import { getElementById } from "./getElem";
import { RawOptions, RawOptionsBasicCheckbox, RawOptionsBasicDropdown, RawOptionsBasicTypes, RawOptionsBasic, EditorRunCommand } from "./rawEditorOptions";
import rimraf from "rimraf";

import rawOptions from './rawEditorOptions';

const fsPromise = fs.promises;

module.exports = (settings: Settings) => {

    var videoData: FileData | null = null,
        trimmedDuration: number | null = null; // will stay null until finish() is called form editor.js

    function randomChars(length: number) {
        let chars = '';
        for (let i = 0; i < length; i++)
            chars += String.fromCharCode(97 + Math.round(Math.random() * 25));
        return chars;
    }

    async function copyFile(infile: PathParsedExt, outfile: PathParsedExt, i = 0) {

        let outfileMod = Object.assign({}, outfile),
            suffix = '';

        if (i >= 10)
            suffix = randomChars(5);
        else if (i > 0)
            suffix += i;

        outfileMod.name += suffix;
        outfileMod.base = outfileMod.name + outfileMod.ext;

        if (fs.existsSync(path.format(outfileMod)))
            copyFile(infile, outfile, i+1);

        await fsPromise.copyFile(path.format(infile), path.format(outfileMod));
        
    }

    function genInfoBase(): editorInfoBase {

        let ret: editorInfoBase = {
            data: videoData,
            duration: trimmedDuration||0,
            settings
        };

        return ret;

    }

    function genInfo() {

        let base = genInfoBase();

        let ret: editorInfo = {
            data: base.data,
            duration: base.duration,
            settings: base.settings,
            options: {
                basic: {},
                advanced: {}
            }
        };

        for (let id in rawOptions.basic) {
            let elem = getElementById('basic_' + id) as HTMLInputElement,
                val = null,
                type: 'checkbox'|'dropdown' = rawOptions.basic[id].type;

            let {parent} = rawOptions.basic[id];

            if (parent !== null)
                type = rawOptions.basic[parent].type;

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

        for (let id in rawOptions.basic) {
            let { dynamic } = rawOptions.basic[id],
                elem = getElementById('basic_' + id);

            if (dynamic.visibility !== null && ['boolean', 'function'].includes(typeof dynamic.visibility)) {
                let val = true;
                if (typeof dynamic.visibility === 'function')
                    val = !dynamic.visibility(info);
                else
                    val = !dynamic.visibility;

                if (val)
                    elem.parentElement?.parentElement?.setAttribute('hidden', '')
                else
                    elem.parentElement?.parentElement?.removeAttribute('hidden');
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

    function onUpdateValues(elem: HTMLInputElement|HTMLSelectElement) {
        elem.addEventListener('change', updateValues);
    }

    function getValue<T extends string|number|boolean = string>(val: T | ((args: any[], info: editorInfoBase) => T), args: any[] = []): T {

        if (typeof val === 'function')
            val = val(args, genInfoBase());

        return val;

    }

    function createDropdown(id: string, options: RawOptionsBasicDropdown) {

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
                select.value = getValue(options.value);

            if (typeof options.on === 'function')
                select.addEventListener('change', e => options.on && options.on(e.target as HTMLElement, genInfo()));

            onUpdateValues(select);

            container.appendChild(select)

        }

        {
            let label = document.createElement('span');
            label.textContent = getValue(options.label);

            container.appendChild(label);
        }

        return container;

    }

    function createCheckbox(id: string, options: RawOptionsBasicCheckbox) {

        let container = document.createElement('label');

        {
            let input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', 'basic_' + id);

            if (options.default && getValue<boolean>(options.default))
                input.checked = true;

            if (typeof options.on === 'function')
                input.addEventListener('change', e => options.on && options.on(e.target as HTMLElement, genInfo()));

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
            label.textContent = getValue(options.label);

            container.appendChild(label);
        }

        return container;

    }

    function createHTML(type: "checkbox"|"dropdown", id: string, options: RawOptionsBasic) {

        switch(type) {
            case 'checkbox':
                return createCheckbox(id, options as RawOptionsBasicCheckbox);
            case 'dropdown':
                return createDropdown(id, options as RawOptionsBasicDropdown);
        }

    }

    function generateOptions(data: FileData) {

        videoData = data;

        const elem = getElementById('quickoptions');

        elem.innerHTML = '';

        const basic = rawOptions.basic;

        for (let id in basic) {
            
            let opt = basic[id];

            let type: RawOptionsBasicTypes;

            if (opt.parent === null)
                type = opt.type;
            else
                type = basic[opt.parent].type;

            let html = createHTML(type, id, opt);
            
            if (opt.small)
                html.classList.add('smaller');

            if (opt.parent !== null) {
                let bigcontainer = getElementById('basic_' + opt.parent).parentElement?.parentElement;
                if (!bigcontainer)
                    throw `unable to reach the parent element of #basic_${opt.parent}`;
                
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

        audio: boolean;
        video: boolean;
        commands: fluentFFMPEG.FfmpegCommand[];
        FF: {
            dir: string,
            mpeg: string,
            probe: string
        };
        tempdir: string;
        temps: ParsedPath[];

        fnames: ParsedPath[];

        constructor(infile: ParsedPath, ffdirs: [string, string, string], tempdir: ParsedPath) {
            this.audio = false;
            this.video = false;
            this.commands = [];
            this.FF = {
                dir: ffdirs[0],
                mpeg: ffdirs[1],
                probe: ffdirs[2]
            };
            this.tempdir = tempdir.dir + tempdir.base;
            this.temps = [];

            this.fnames = [];
        }
        
        genTemp(ext: string) {

            if (!fs.existsSync(this.tempdir))
                fs.mkdirSync(this.tempdir);

            let genFname = (): string => {
                let chars = randomChars(20);
                if (fs.existsSync(path.join(this.tempdir, chars + ext)))
                    return genFname();
                return chars;
            };

            let tempfname = genFname();

            let ret: ParsedPath = path.parse(path.join(this.tempdir, tempfname + ext));

            this.temps.push(ret);

            return ret;
        }

        clearTemp() {
            return new Promise((complete, error) =>
                rimraf(this.tempdir, complete));
        }

        newCommand(fname: ParsedPath, ffmpeg: fluentFFMPEG.FfmpegCommand) {
            if (ffmpeg) {
                this.commands.push(ffmpeg);
                this.fnames.push(fname);
            }

            return fluentFFMPEG();
        }

        rawffmpeg(args: string[]) {
            return shell(this.FF.mpeg, args);
        }

        rawffprobe(args: string[]) {
            return shell(this.FF.probe, args);
        }

        /**
         * 
         * @param f function (taken from rawEdtorOptions.ts)
         * @param val value of the input selected
         * @param isfirst 
         * @param islast 
         * @param infname 
         * @param tempdir (unused)
         * @param prePrepare function (i think it's taken from a higher file)
         * @param referencePath 
         * @returns 
         */
        fullcommand(f: EditorRunCommand, val: boolean|string, isfirst: boolean, islast: boolean, infname: PathParsedExt, tempdir, prePrepare: (command: FfmpegCommand, isfirst: boolean, islast: boolean) => void, referencePath: path.ParsedPath): Promise<[string, PathParsedExt, PathParsedExt]|[]> {// function(fluentFFMPEG, video info + commands, input value), input value

            return new Promise((complete, fail) => {

                if (!f)
                    complete([]);
                else {

                    //console.log('input', this.getInput(), 'output', this.getOutput(), this.fnames);

                    let outfname: PathParsedExt|null = null;

                    //data and some functions to be sent to the command 

                    let info = {
                        ...genInfo(),
                    
                        //info.newCommand = (fname, ffmpeg) => this.newCommand(fname, ffmpeg);
                        /*info.getOutput = fnameSuffix => this.getOutput(fnameSuffix);
                        info.getOutputPath = fnameSuffix => path.format(this.getOutput(fnameSuffix));*/

                        getInput: () => Object.assign({}, infname),
                        getInputPath: () => path.format(info.getInput()),
                        rawffmpeg: (args: string[]) => this.rawffmpeg(args),
                        rawffprobe: (args: string[]) => this.rawffprobe(args),
                        asNewFile: (outSuffix='_edited') => {
                            
                            if (infname.isTemp) {
                                //copy last one out
                                let copyLastfname = Object.assign({}, referencePath);
                                copyLastfname.name += outSuffix;
                                copyLastfname.base = copyLastfname.name + copyLastfname.ext;

                                copyFile(infname, copyLastfname);
                            }

                            outfname = Object.assign({}, referencePath);
                            outfname.name += outSuffix;
                            outfname.base = outfname.name + outfname.ext;

                            return outfname;
                        }
                    };

                    let cmd = f(fluentFFMPEG(), info, val) as FfmpegCommandExt;

                    //might deprecate in favor of info.asNewFile(outSuffix)
                    if (cmd instanceof Array) {
                        let ofn: string;
                        [cmd, ofn] = cmd;
                        outfname = path.parse(ofn);
                    }

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

                        cmd._prepare(function (err: any, args: string) {
                            if (err)
                                fail(err);
                            else if (!outfname)
                                fail('weird');
                            else
                                complete([args, tempfname, outfname]);
                        });

                    }

                }

            });

        }

    }

    type runffmpegEach = {
        eachCommand: (args: string[]) => Promise<null>;
        finish: () => void;
        prePrepare: (command: FfmpegCommand, isfirst: boolean, islast: boolean) => void;
    }

    return {
        generate: (data: FileData) => generateOptions(data), //create html for options from rawEditorOptions.js
        finish: (videoSrc: path.ParsedPath, tmpDir: path.ParsedPath, runFFMPEGFirst: (total: number) => runffmpegEach, ffdirs: [path.ParsedPath, path.ParsedPath, path.ParsedPath], trimmedDur: number) => {
            trimmedDuration = trimmedDur;

            const ffdirsStr: [string, string, string] = [ '', '', '' ];

            ffdirs.forEach((ff, i) => ffdirsStr[i] = path.format(ff));

            //var ffmpeg = new ffmpegWrapper(videoSrc, path.parse(`${videoSrc.dir}/${videoSrc.name}_edited${videoSrc.ext}`), ffdirs);
            var ffmpeg = new ffmpegWrapper(videoSrc, ffdirsStr, tmpDir),
                allRunFuncs: any[] = [];

            for (let id in rawOptions.basic) {
                let { dynamic } = rawOptions.basic[id],
                    elem = getElementById('basic_' + id),
                    val = null,
                    shouldrun = true;

                switch (rawOptions.basic[id].type) {
                    case 'checkbox':
                        val = (elem as HTMLInputElement).checked;
                        break;
                    case 'dropdown':
                        val = (elem as HTMLSelectElement).value;
                        break;
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

                if (shouldrun && rawOptions.basic[id].run !== null)
                    allRunFuncs.push([rawOptions.basic[id].run, val]);

            }

            const runFFMPEG = runFFMPEGFirst(allRunFuncs.length);

            let lastNontempPath: PathParsedExt | null = null;

            const eachOption = (i: number, infname: PathParsedExt) => {
                if (i < allRunFuncs.length && typeof allRunFuncs[i] === 'object') {

                    console.log('infname', infname);

                    if (lastNontempPath === null || (infname && !infname.isTemp))
                        lastNontempPath = infname;

                    let args = [i === 0, i === allRunFuncs.length - 1, infname, tmpDir, runFFMPEG.prePrepare, lastNontempPath];

                    ffmpeg.fullcommand(...allRunFuncs[i], ...args).then(([args, tempfname, outfname]) => {
                        runFFMPEG.eachCommand(args).then(cancelled => {
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