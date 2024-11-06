import type { _OverlayGridApi } from '../../api/gridApi';
import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../../interfaces/iModule';
import { LoadingOverlayComponent } from './loadingOverlayComponent';
import { NoRowsOverlayComponent } from './noRowsOverlayComponent';
import { hideOverlay, showLoadingOverlay, showNoRowsOverlay } from './overlayApi';
import { OverlayService } from './overlayService';

/**
 * @feature Accessories -> Overlays
 * @gridOption loading, overlayLoadingTemplate, loadingOverlayComponent, overlayNoRowsTemplate, noRowsOverlayComponent
 */
export const OverlayCoreModule: _ModuleWithApi<_OverlayGridApi> = {
    ...baseCommunityModule('OverlayCoreModule'),
    apiFunctions: {
        showLoadingOverlay,
        showNoRowsOverlay,
        hideOverlay,
    },
    beans: [OverlayService],
};

/**
 * @feature Accessories -> Overlays
 */
export const LoadingOverlayModule: _ModuleWithoutApi = {
    ...baseCommunityModule('LoadingOverlayModule'),
    userComponents: {
        agLoadingOverlay: LoadingOverlayComponent,
    },
    dependsOn: [OverlayCoreModule],
};

/**
 * @feature Accessories -> Overlays
 */
export const NoRowsOverlayModule: _ModuleWithoutApi = {
    ...baseCommunityModule('NoRowsOverlayModule'),
    userComponents: {
        agNoRowsOverlay: NoRowsOverlayComponent,
    },
    dependsOn: [OverlayCoreModule],
};

/**
 * @feature Accessories -> Overlays
 */
export const OverlayModule: _ModuleWithoutApi = {
    ...baseCommunityModule('OverlayModule'),
    dependsOn: [OverlayCoreModule, LoadingOverlayModule, NoRowsOverlayModule],
};
