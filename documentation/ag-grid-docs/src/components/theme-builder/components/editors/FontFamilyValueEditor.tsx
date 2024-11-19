import { Select } from '@ag-website-shared/components/select/Select';
import styled from '@emotion/styled';

import { _theming } from 'ag-grid-community';

import type { ValueEditorProps } from './ValueEditorProps';

export const FontFamilyValueEditor = ({ param, value, onChange }: ValueEditorProps<_theming.FontFamilyValue>) => {
    const options = param.property === 'fontFamily' ? topLevelOptions : subLevelOptions;
    const selectedOption = options.find((o) => isSameFont(o.value, value)) || options[0];

    return (
        <Select
            options={options}
            value={selectedOption}
            getKey={(option) => option.label}
            onChange={(newValue) => onChange(newValue.value)}
            renderItem={(o) => {
                const font = _theming.paramValueToCss('fontFamily', o.value);
                return (
                    <FontItem style={{ fontFamily: typeof font === 'string' ? font : undefined }}>{o.label}</FontItem>
                );
            }}
        />
    );
};

const FontItem = styled('span')``;

const fontOptions: { label: string; value: _theming.FontFamilyValue }[] = [
    {
        label: 'System',
        value: [
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Oxygen-Sans',
            'Ubuntu',
            'Cantarell',
            'Helvetica Neue',
            'sans-serif',
        ],
    },
    {
        label: 'Arial',
        value: ['Arial', 'sans-serif'],
    },
    {
        label: 'Inter',
        value: { googleFont: 'Inter' },
    },
    {
        label: 'IBM Plex Sans',
        value: { googleFont: 'IBM Plex Sans' },
    },
    {
        label: 'IBM Plex Mono',
        value: { googleFont: 'IBM Plex Mono' },
    },
    {
        label: 'Roboto',
        value: { googleFont: 'Roboto' },
    },
    {
        label: 'Inclusive Sans',
        value: { googleFont: 'Inclusive Sans' },
    },
    {
        label: 'Open Sans',
        value: { googleFont: 'Open Sans' },
    },
    {
        label: 'Lato',
        value: { googleFont: 'Lato' },
    },
    {
        label: 'Times New Roman',
        value: 'Times New Roman',
    },
    {
        label: 'Merriweather',
        value: { googleFont: 'Merriweather' },
    },
    {
        label: 'UnifrakturCook',
        value: { googleFont: 'UnifrakturCook' },
    },
    {
        label: 'Pixelify Sans',
        value: { googleFont: 'Pixelify Sans' },
    },
];
const topLevelOptions = [{ label: 'Same as application', value: 'inherit' }, ...fontOptions];
const subLevelOptions = [{ label: 'Unchanged', value: 'inherit' }, ...fontOptions];

export const LoadFontFamilyMenuFonts = () => {
    const css = fontOptions
        .map(({ value }) => value)
        .filter((v: unknown): v is { googleFont: string } => typeof v === 'object' && v != null && 'googleFont' in v)
        .map((v) => v.googleFont)
        .sort()
        .map(
            (font) =>
                `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap');\n`
        )
        .join('\n');
    return <style>{css}</style>;
};

const isSameFont = (a: _theming.FontFamilyValue, b: _theming.FontFamilyValue): boolean =>
    (Array.isArray(b) && isSameFont(a, b[0])) ||
    (Array.isArray(a) && isSameFont(a[0], b)) ||
    _theming.paramValueToCss('fontFamily', a) === _theming.paramValueToCss('fontFamily', b);
