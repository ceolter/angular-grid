import { _getLoadingOverlayCompDetails, _getNoRowsOverlayCompDetails } from '../../components/framework/userCompUtils';
import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { GridOptions } from '../../entities/gridOptions';
import { _isClientSideRowModel } from '../../gridOptionsUtils';
import type { UserCompDetails } from '../../interfaces/iUserCompDetails';
import { _warn } from '../../validation/logging';
import type { ComponentSelector } from '../../widgets/component';
import { OverlayWrapperComponent, OverlayWrapperSelector } from './overlayWrapperComponent';

const enum OverlayServiceState {
    Hidden = 0,
    Loading = 1,
    NoRows = 2,
}

export class OverlayService extends BeanStub implements NamedBean {
    beanName = 'overlays' as const;

    private isClientSide: boolean;
    private state: OverlayServiceState = OverlayServiceState.Hidden;
    private showInitialOverlay: boolean = true;
    private exclusive?: boolean;
    private wrapperPadding: number = 0;

    public eWrapper: OverlayWrapperComponent | undefined;

    public postConstruct(): void {
        this.isClientSide = _isClientSideRowModel(this.gos);
        const updateOverlayVisibility = () => this.updateOverlayVisibility();

        this.addManagedEventListeners({
            newColumnsLoaded: updateOverlayVisibility,
            rowDataUpdated: updateOverlayVisibility,
            gridSizeChanged: this.refreshWrapperPadding.bind(this),
            rowCountReady: () => {
                // Support hiding the initial overlay when data is set via transactions.
                this.showInitialOverlay = false;
                this.updateOverlayVisibility();
            },
        });

        this.addManagedPropertyListener('loading', updateOverlayVisibility);
    }

    public setOverlayWrapperComp(overlayWrapperComp: OverlayWrapperComponent | undefined): void {
        this.eWrapper = overlayWrapperComp;
        this.updateOverlayVisibility();
    }

    /** Returns true if the overlay is visible. */
    public isVisible(): boolean {
        return this.state !== OverlayServiceState.Hidden && !!this.eWrapper;
    }

    /** Returns true if the overlay is visible and is exclusive (popup over the grid) */
    public isExclusive(): boolean {
        return this.state === OverlayServiceState.Loading && !!this.eWrapper;
    }

    public showLoadingOverlay(): void {
        this.showInitialOverlay = false;

        const gos = this.gos;
        const loading = gos.get('loading');
        if (!loading && (loading !== undefined || gos.get('suppressLoadingOverlay'))) {
            return;
        }

        this.doShowLoadingOverlay();
    }

    public showNoRowsOverlay(): void {
        this.showInitialOverlay = false;

        const gos = this.gos;
        if (gos.get('loading') || gos.get('suppressNoRowsOverlay')) {
            return;
        }

        this.doShowNoRowsOverlay();
    }

    public hideOverlay(): void {
        this.showInitialOverlay = false;

        if (this.gos.get('loading')) {
            _warn(99);
            return;
        }

        this.doHideOverlay();
    }

    public getOverlayWrapperSelector(): ComponentSelector {
        return OverlayWrapperSelector;
    }

    public getOverlayWrapperCompClass(): typeof OverlayWrapperComponent {
        return OverlayWrapperComponent;
    }

    private updateOverlayVisibility(): void {
        if (!this.eWrapper) {
            this.state = OverlayServiceState.Hidden;
            return;
        }

        const {
            state,
            isClientSide,
            beans: { gos, colModel, rowModel },
        } = this;
        let loading = this.gos.get('loading');

        if (loading !== undefined) {
            // If loading is defined, we don't show the initial overlay.
            this.showInitialOverlay = false;
        }

        if (this.showInitialOverlay && loading === undefined && !gos.get('suppressLoadingOverlay')) {
            loading = !gos.get('columnDefs') || !colModel.ready || (!gos.get('rowData') && isClientSide);
        }

        if (loading) {
            if (state !== OverlayServiceState.Loading) {
                this.doShowLoadingOverlay();
            }
        } else {
            this.showInitialOverlay = false;
            if (rowModel.isEmpty() && !gos.get('suppressNoRowsOverlay') && isClientSide) {
                if (state !== OverlayServiceState.NoRows) {
                    this.doShowNoRowsOverlay();
                }
            } else if (state !== OverlayServiceState.Hidden) {
                this.doHideOverlay();
            }
        }
    }

    private doShowLoadingOverlay(): void {
        if (!this.eWrapper) {
            return;
        }

        this.state = OverlayServiceState.Loading;
        this.showOverlay(
            _getLoadingOverlayCompDetails(this.beans.userCompFactory, {}),
            'ag-overlay-loading-wrapper',
            'loadingOverlayComponentParams'
        );
        this.updateExclusive();
    }

    private doShowNoRowsOverlay(): void {
        if (!this.eWrapper) {
            return;
        }

        this.state = OverlayServiceState.NoRows;
        this.showOverlay(
            _getNoRowsOverlayCompDetails(this.beans.userCompFactory, {}),
            'ag-overlay-no-rows-wrapper',
            'noRowsOverlayComponentParams'
        );
        this.updateExclusive();
    }

    private doHideOverlay(): void {
        if (!this.eWrapper) {
            return;
        }

        this.state = OverlayServiceState.Hidden;
        this.eWrapper.hideOverlay();
        this.updateExclusive();
    }

    private showOverlay(
        compDetails: UserCompDetails | undefined,
        wrapperCssClass: string,
        gridOption: keyof GridOptions
    ): void {
        const promise = compDetails?.newAgStackInstance() ?? null;
        this.eWrapper?.showOverlay(promise, wrapperCssClass, this.isExclusive(), gridOption);
        this.refreshWrapperPadding();
    }

    private updateExclusive(): void {
        const wasExclusive = this.exclusive;
        this.exclusive = this.isExclusive();
        if (this.exclusive !== wasExclusive) {
            this.eventSvc.dispatchEvent({
                type: 'overlayExclusiveChanged',
            });
        }
    }

    private refreshWrapperPadding(): void {
        const eWrapper = this.eWrapper;
        if (!eWrapper) {
            return;
        }

        let newPadding: number = 0;

        if (this.state === OverlayServiceState.NoRows) {
            const headerCtrl = this.beans.ctrlsSvc.get('gridHeaderCtrl');
            const headerHeight = headerCtrl?.headerHeight || 0;

            newPadding = headerHeight;
        } else if (this.wrapperPadding !== 0) {
            newPadding = 0;
        }

        if (this.wrapperPadding === newPadding) {
            return;
        }

        this.wrapperPadding = newPadding;
        eWrapper.updateOverlayWrapperPaddingTop(newPadding);
    }
}
