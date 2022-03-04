import { css } from '@emotion/css';
import Checkbox from '../components/checkbox';
import Theme from '../styles/theme';
import { PageProps } from '../types/component';

export default function Main({ }: PageProps<{}>) {

    const Color = Theme.color['dark'];

    return (
        <div class={css`
        color: ${Color.text};
        `}>
            <Checkbox label="Test" />
        </div>
    );
}