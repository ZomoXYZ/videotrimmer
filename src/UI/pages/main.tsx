import { css } from "@emotion/css";
import Button from "../components/button";
import Icons from "../components/icon";
import Version from "../components/version";
import { getColor, getFont } from "../styles/theme";

export default function Main() {
    const Color = getColor(),
        Font = getFont();

    return (
        <div>
            <div>Drag Video To Edit</div>
            <div>or</div>
            <Button type="file">Click to Choose File</Button>
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
        </div>
    );
}
