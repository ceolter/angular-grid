import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { AnimateShowChangeCellRenderer } from './animateShowChangeCellRenderer';
import { AnimateSlideCellRenderer } from './animateSlideCellRenderer';
import { CheckboxCellRenderer } from './checkboxCellRenderer';

/**
 * @feature Cells -> Highlighting Changes
 * @colDef cellRenderer
 */
export const AnimateShowChangeCellRendererModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AnimateShowChangeCellRendererModule'),
    userComponents: {
        agAnimateShowChangeCellRenderer: AnimateShowChangeCellRenderer,
    },
};

/**
 * @feature Cells -> Highlighting Changes
 * @colDef cellRenderer
 */
export const AnimateSlideCellRendererModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AnimateSlideCellRendererModule'),
    userComponents: {
        agAnimateSlideCellRenderer: AnimateSlideCellRenderer,
    },
};

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
