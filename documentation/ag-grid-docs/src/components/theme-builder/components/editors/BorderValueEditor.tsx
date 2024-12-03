import { type BorderValue } from '@components/theme-builder/api';

import { Checkbox } from '../general/Checkbox';
import type { ValueEditorProps } from './ValueEditorProps';

export const BorderValueEditor = ({ value, onChange }: ValueEditorProps<BorderValue>) => {
    const checked = !!value;
    return (
        <Checkbox
            checked={checked}
            onChange={(checked) => {
                onChange(checked);
            }}
            useSwitch
        />
    );
};
