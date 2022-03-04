import { css } from '@emotion/css';
import Checkbox from '../components/checkbox';
import { PageProps } from '../types/component';
import { getColor } from '../styles/theme';
import Dropdown, { DropdownOptions } from '../components/dropdown';

export default function Main({ }: PageProps<{}>) {

    const Color = getColor();

    const dropdownOptions: DropdownOptions = [
        ['auto', 'auto'],
        ['discord', 'discord auto'],
        ['large', 'large'],
        ['medium', 'medium'],
        ['small', 'small']
    ]

    return (
        <div class={css`
        color: ${Color.text};
        `}>
            <div><Checkbox label="Test" /></div>
            <div><Checkbox checked label="Test" /></div>
            <div><Checkbox disabled label="Test" /></div>
            <div><Checkbox checked disabled label="Test" /></div>
            <div><Dropdown label="Test Dropdown" options={dropdownOptions} /></div>
            <div><Dropdown disabled label="Test Dropdown" options={dropdownOptions} /></div>
        </div>
    );
}