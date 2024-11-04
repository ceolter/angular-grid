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
export const OverlayCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('OverlayCoreModule'),
    beans: [OverlayService],
};

/**
 * @feature Accessories -> Overlays
 */
export const OverlayApiModule: _ModuleWithApi<_OverlayGridApi> = {
    ...baseCommunityModule('OverlayApiModule'),
    apiFunctions: {
        showLoadingOverlay,
        showNoRowsOverlay,
        hideOverlay,
    },
    dependsOn: [OverlayCoreModule],
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
    dependsOn: [OverlayCoreModule, OverlayApiModule, LoadingOverlayModule, NoRowsOverlayModule],
};
