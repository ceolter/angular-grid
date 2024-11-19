import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { CheckboxCellRenderer } from './checkboxCellRenderer';

/**
 * @feature Cells -> Cell Data Types
 * @colDef cellDataType
 */
export const CheckboxCellRendererModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CheckboxCellRendererModule'),
    userComponents: {
        agCheckboxCellRenderer: CheckboxCellRenderer,
    },
};
