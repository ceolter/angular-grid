import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { baseCommunityModule } from '../../interfaces/iModule';
import { AnimateShowChangeCellRenderer } from '../cellRenderers/animateShowChangeCellRenderer';
import { AnimateSlideCellRenderer } from '../cellRenderers/animateSlideCellRenderer';
import { CellFlashService } from './cellFlashService';

/**
 * @feature Cells -> Highlighting Changes
 * @colDef enableCellChangeFlash
 */
export const HighlightChangesModule: _ModuleWithoutApi = {
    ...baseCommunityModule('HighlightChanges'),
    beans: [CellFlashService],
    userComponents: {
        agAnimateShowChangeCellRenderer: AnimateShowChangeCellRenderer,
        agAnimateSlideCellRenderer: AnimateSlideCellRenderer,
    },
};
