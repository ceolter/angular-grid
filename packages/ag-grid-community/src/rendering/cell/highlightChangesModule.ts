import type { _HighlightChangesGridApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { AnimateShowChangeCellRenderer } from '../cellRenderers/animateShowChangeCellRenderer';
import { AnimateSlideCellRenderer } from '../cellRenderers/animateSlideCellRenderer';
import { CellFlashService } from './cellFlashService';
import { flashCells } from './highlightChangesApi';

/**
 * @feature Cells -> Highlighting Changes
 * @colDef enableCellChangeFlash
 */
export const HighlightChangesModule: _ModuleWithApi<_HighlightChangesGridApi<any>> = {
    moduleName: 'HighlightChanges',
    version: VERSION,
    beans: [CellFlashService],
    userComponents: {
        agAnimateShowChangeCellRenderer: AnimateShowChangeCellRenderer,
        agAnimateSlideCellRenderer: AnimateSlideCellRenderer,
    },
    apiFunctions: {
        flashCells,
    },
};
