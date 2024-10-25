import type { ColumnModel } from '../../columns/columnModel';
import { _getLoadingOverlayCompDetails, _getNoRowsOverlayCompDetails } from '../../components/framework/userCompUtils';
import type { UserComponentFactory } from '../../components/framework/userComponentFactory';
import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { GridOptions } from '../../entities/gridOptions';
import { _isClientSideRowModel } from '../../gridOptionsUtils';
import type { IRowModel } from '../../interfaces/iRowModel';
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

    private userCompFactory: UserComponentFactory;
    private rowModel: IRowModel;
    private ctrlsSvc: CtrlsService;
    private isClientSide: boolean;
    private colModel: ColumnModel;

    private state: OverlayServiceState = OverlayServiceState.Hidden;
    private showInitialOverlay: boolean = true;
    private exclusive?: boolean;
    private wrapperPadding: number = 0;

    public wireBeans(beans: BeanCollection): void {
        this.userCompFactory = beans.userCompFactory;
        this.rowModel = beans.rowModel;
        this.colModel = beans.colModel;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private overlayWrapperComp: OverlayWrapperComponent | undefined;

    public postConstruct(): void {
        this.isClientSide = _isClientSideRowModel(this.gos);
        const updateOverlayVisibility = () => this.updateOverlayVisibility();

        this.addManagedEventListeners({
            newColumnsLoaded: updateOverlayVisibility,
            rowDataUpdated: updateOverlayVisibility,
            gridSizeChanged: this.onGridSizeChanged.bind(this),
            rowCountReady: () => {
                // Support hiding the initial overlay when data is set via transactions.
                this.showInitialOverlay = false;
                this.updateOverlayVisibility();
            },
        });

        this.addManagedPropertyListener('loading', updateOverlayVisibility);
    }

    public setOverlayWrapperComp(overlayWrapperComp: OverlayWrapperComponent | undefined): void {
        this.overlayWrapperComp = overlayWrapperComp;
        this.updateOverlayVisibility();
    }

    /** Returns true if the overlay is visible. */
    public isVisible(): boolean {
        return this.state !== OverlayServiceState.Hidden && !!this.overlayWrapperComp;
    }

    /** Returns true if the overlay is visible and is exclusive (popup over the grid) */
    public isExclusive(): boolean {
        return this.state === OverlayServiceState.Loading && !!this.overlayWrapperComp;
    }

    /** Gets the overlay wrapper component */
    public getOverlayWrapper(): OverlayWrapperComponent | undefined {
        return this.overlayWrapperComp;
    }

    public showLoadingOverlay(): void {
        this.showInitialOverlay = false;

        const loading = this.gos.get('loading');
        if (!loading && (loading !== undefined || this.gos.get('suppressLoadingOverlay'))) {
            return;
        }

        this.doShowLoadingOverlay();
    }

    public showNoRowsOverlay(): void {
        this.showInitialOverlay = false;

        if (this.gos.get('loading') || this.gos.get('suppressNoRowsOverlay')) {
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
        if (!this.overlayWrapperComp) {
            this.state = OverlayServiceState.Hidden;
            return;
        }

        let loading = this.gos.get('loading');

        if (loading !== undefined) {
            // If loading is defined, we don't show the initial overlay.
            this.showInitialOverlay = false;
        }

        if (this.showInitialOverlay && loading === undefined && !this.gos.get('suppressLoadingOverlay')) {
            loading =
                !this.gos.get('columnDefs') || !this.colModel.ready || (!this.gos.get('rowData') && this.isClientSide);
        }

        if (loading) {
            if (this.state !== OverlayServiceState.Loading) {
                this.doShowLoadingOverlay();
            }
        } else {
            this.showInitialOverlay = false;
            if (this.rowModel.isEmpty() && !this.gos.get('suppressNoRowsOverlay') && this.isClientSide) {
                if (this.state !== OverlayServiceState.NoRows) {
                    this.doShowNoRowsOverlay();
                }
            } else if (this.state !== OverlayServiceState.Hidden) {
                this.doHideOverlay();
            }
        }
    }

    private doShowLoadingOverlay(): void {
        if (!this.overlayWrapperComp) {
            return;
        }

        this.state = OverlayServiceState.Loading;
        this.showOverlay(
            _getLoadingOverlayCompDetails(this.userCompFactory, {}),
            'ag-overlay-loading-wrapper',
            'loadingOverlayComponentParams'
        );
        this.updateExclusive();
    }

    private doShowNoRowsOverlay(): void {
        if (!this.overlayWrapperComp) {
            return;
        }

        this.state = OverlayServiceState.NoRows;
        this.showOverlay(
            _getNoRowsOverlayCompDetails(this.userCompFactory, {}),
            'ag-overlay-no-rows-wrapper',
            'noRowsOverlayComponentParams'
        );
        this.updateExclusive();
    }

    private doHideOverlay(): void {
        if (!this.overlayWrapperComp) {
            return;
        }

        this.state = OverlayServiceState.Hidden;
        this.overlayWrapperComp.hideOverlay();
        this.updateExclusive();
    }

    private showOverlay(compDetails: UserCompDetails, wrapperCssClass: string, gridOption: keyof GridOptions): void {
        const promise = compDetails.newAgStackInstance();
        this.overlayWrapperComp?.showOverlay(promise, wrapperCssClass, this.isExclusive(), gridOption);
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

    private onGridSizeChanged(): void {
        this.refreshWrapperPadding();
    }

    private refreshWrapperPadding(): void {
        if (!this.overlayWrapperComp) {
            return;
        }

        let newPadding: number = 0;

        if (this.state === OverlayServiceState.NoRows) {
            const headerCtrl = this.ctrlsSvc.get('gridHeaderCtrl');
            const headerHeight = headerCtrl?.getHeaderHeight() || 0;

            newPadding = headerHeight;
        } else if (this.wrapperPadding !== 0) {
            newPadding = 0;
        }

        if (this.wrapperPadding === newPadding) {
            return;
        }

        this.wrapperPadding = newPadding;
        this.overlayWrapperComp.updateOverlayWrapperPaddingTop(newPadding);
    }
}
