import type { _OverlayGridApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { LoadingOverlayComponent } from './loadingOverlayComponent';
import { NoRowsOverlayComponent } from './noRowsOverlayComponent';
import { hideOverlay, showLoadingOverlay, showNoRowsOverlay } from './overlayApi';
import { OverlayService } from './overlayService';

/**
 * @feature Accessories -> Overlays
 * @gridOption loading, overlayLoadingTemplate, loadingOverlayComponent, overlayNoRowsTemplate, noRowsOverlayComponent
 */
export const OverlayModule: _ModuleWithApi<_OverlayGridApi> = {
    moduleName: 'Overlay',
    version: VERSION,
    userComponents: {
        agLoadingOverlay: LoadingOverlayComponent,
        agNoRowsOverlay: NoRowsOverlayComponent,
    },
    apiFunctions: {
        showLoadingOverlay,
        showNoRowsOverlay,
        hideOverlay,
    },
    beans: [OverlayService],
};
