import { Select } from '@ag-website-shared/components/select/Select';
import { type FontWeightValue } from '@components/theme-builder/api';

import type { ValueEditorProps } from './ValueEditorProps';

export const FontWeightValueEditor = ({ value, onChange }: ValueEditorProps<FontWeightValue>) => {
    const selectedOption = fontWeightOptions.find((o) => o.value === value) || fontWeightOptions[0];

    return (
        <Select
            options={fontWeightOptions}
            value={selectedOption}
            onChange={(newValue) => onChange(newValue.value)}
            renderItem={(o) => {
                return <span>{o.label}</span>;
            }}
        />
    );
};

const fontWeightOptions = [
    {
        label: 'Thin (100)',
        value: 100,
    },
    {
        label: 'Extra Light (200)',
        value: 200,
    },
    {
        label: 'Light (300)',
        value: 300,
    },
    {
        label: 'Normal (400)',
        value: 400,
    },
    {
        label: 'Medium (500)',
        value: 500,
    },
    {
        label: 'Semi Bold (600)',
        value: 600,
    },
    {
        label: 'Bold (700)',
        value: 700,
    },
    {
        label: 'Extra Bold (800)',
        value: 800,
    },
    {
        label: 'Black (900)',
        value: 900,
    },
];
