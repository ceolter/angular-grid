import { Select } from '@ag-website-shared/components/select/Select';

import type { _theming } from 'ag-grid-community';

import type { ValueEditorProps } from './ValueEditorProps';

export const ColorSchemeValueEditor = ({ value, onChange }: ValueEditorProps<_theming.ColorSchemeValue>) => {
    return <Select options={['inherit', 'light', 'dark']} value={value} onChange={onChange} />;
};
