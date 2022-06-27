import { css } from "@emotion/css";
import { Fragment, useCallback, useState } from "react";
import Button from "../components/button";
import Icons from "../components/icon";
import Version from "../components/version";
import { getColor, getFont } from "../styles/theme";
import { DropzoneState, useDropzone } from 'react-dropzone'
import Editor from "./editor";
import { ElectronFile } from "../types/electron";
import { Page } from "../styles/page";

export default function () {

    const [editorFile, setEditorFile] = useState<ElectronFile | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        let files = acceptedFiles.filter(file => file.type.split('/')[0] === 'video') as ElectronFile[]
        if (files.length > 0) {
            setEditorFile(files[0]);
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true }) //TODO useFsAccessApi: true

    return (
        <Page {...getRootProps()}>
            {(() => {
                if (editorFile) {
                    return <Editor file={editorFile} />
                }
                return <MainDisplay getInputProps={getInputProps} />
            })()}
            {isDragActive && <Hovering />}
        </Page>
    );
}

function Hovering() {
    const { background } = getColor();
    return (
        <Page style={{ background }}>
            <div>Release To Edit</div>
        </Page>
    )
}

function MainDisplay({ getInputProps }: { getInputProps: DropzoneState['getInputProps'] }) {
    const Color = getColor(),
        Font = getFont();

    return (
        <Fragment>
            <div>Drag Video To Edit</div>
            <div>or</div>
            <Button type="file" accept="video/*" input={getInputProps()}>Click to Choose File</Button>
            <Version
                className={css`
                    position: fixed;
                    bottom: 10px;
                    left: 10px;
                    font-size: ${Font.size.version};
                `}
            />
            <Button
                className={css`
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    padding: 4px;
                `}
            >
                <Icons.Cog
                    className={css`
                        fill: ${Color.text};
                        width: 22px;
                    `}
                />
            </Button>
        </Fragment>
    )
}
