import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { AnimateShowChangeCellRenderer } from '../cellRenderers/animateShowChangeCellRenderer';
import { AnimateSlideCellRenderer } from '../cellRenderers/animateSlideCellRenderer';
import { CellFlashService } from './cellFlashService';

/**
 * @feature Cells -> Highlighting Changes
 * @colDef enableCellChangeFlash
 */
export const HighlightChangesModule: _ModuleWithoutApi = {
    moduleName: 'HighlightChanges',
    version: VERSION,
    beans: [CellFlashService],
    userComponents: {
        agAnimateShowChangeCellRenderer: AnimateShowChangeCellRenderer,
        agAnimateSlideCellRenderer: AnimateSlideCellRenderer,
    },
};
