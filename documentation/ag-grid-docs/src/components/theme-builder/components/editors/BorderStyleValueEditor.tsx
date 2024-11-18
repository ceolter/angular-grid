import { Select } from '@ag-website-shared/components/select/Select';

import type { _theming } from 'ag-grid-community';

import type { ValueEditorProps } from './ValueEditorProps';

export const BorderStyleValueEditor = ({ value, onChange }: ValueEditorProps<_theming.BorderStyleValue>) => {
    return <Select options={['none', 'solid', 'dotted', 'dashed']} value={value} onChange={onChange} />;
};
