import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { CheckboxCellRenderer } from './checkboxCellRenderer';

/**
 * @feature Cells -> Cell Data Types
 * @colDef cellDataType
 */
export const CheckboxCellRendererModule: _ModuleWithoutApi = {
    moduleName: 'CheckboxCellRenderer',
    version: VERSION,
    userComponents: {
        agCheckboxCellRenderer: CheckboxCellRenderer,
    },
};
