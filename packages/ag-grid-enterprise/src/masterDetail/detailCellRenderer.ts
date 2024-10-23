import type {
    BeanCollection,
    Context,
    GridApi,
    GridOptions,
    GridParams,
    ICellRenderer,
    IDetailCellRenderer,
    IDetailCellRendererParams,
} from 'ag-grid-community';
import { Component, RefPlaceholder, _getGridRegisteredModules, _missing, _warn, createGrid } from 'ag-grid-community';

import { detailCellRendererCSS } from './detailCellRenderer.css-GENERATED';
import { DetailCellRendererCtrl } from './detailCellRendererCtrl';
import { DetailFrameworkComponentWrapper } from './detailFrameworkComponentWrapper';

export class DetailCellRenderer extends Component implements ICellRenderer {
    private eDetailGrid: HTMLElement = RefPlaceholder;

    private detailApi: GridApi;
    private params: IDetailCellRendererParams;
    private ctrl: DetailCellRendererCtrl;
    private context: Context;

    constructor() {
        super();
        this.registerCSS(detailCellRendererCSS);
    }

    public wireBeans(beans: BeanCollection): void {
        this.context = beans.context;
    }

    public init(params: IDetailCellRendererParams): void {
        this.params = params;
        this.selectAndSetTemplate();

        const compProxy: IDetailCellRenderer = {
            addOrRemoveCssClass: (cssClassName: string, on: boolean) => this.addOrRemoveCssClass(cssClassName, on),
            addOrRemoveDetailGridCssClass: (cssClassName: string, on: boolean) =>
                this.eDetailGrid.classList.toggle(cssClassName, on),
            setDetailGrid: (gridOptions) => this.setDetailGrid(gridOptions),
            setRowData: (rowData) => this.setRowData(rowData),
            getGui: () => this.eDetailGrid,
        };

        this.ctrl = this.createManagedBean(new DetailCellRendererCtrl());
        this.ctrl.init(compProxy, params);
    }

    public refresh(): boolean {
        return this.ctrl && this.ctrl.refresh();
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }

    private selectAndSetTemplate(): void {
        if (this.params.pinned) {
            this.setTemplate(/* html*/ `<div class="ag-details-row"></div>`);
            return;
        }

        const setDefaultTemplate = () => {
            this.setTemplate(/* html */ `<div class="ag-details-row" role="gridcell">
                <div data-ref="eDetailGrid" class="ag-details-grid" role="presentation"></div>
            </div>`);
        };

        if (_missing(this.params.template)) {
            // use default template
            setDefaultTemplate();
        } else {
            // use user provided template
            if (typeof this.params.template === 'string') {
                this.setTemplate(this.params.template, []);
            } else if (typeof this.params.template === 'function') {
                const templateFunc = this.params.template;
                const template = templateFunc(this.params);
                this.setTemplate(template, []);
            } else {
                _warn(168);
                setDefaultTemplate();
            }
        }

        if (this.eDetailGrid == null) {
            _warn(169);
        }
    }

    private setDetailGrid(gridOptions: GridOptions): void {
        if (!this.eDetailGrid) {
            return;
        }

        // when we create detail grid, the detail grid needs frameworkComponentWrapper so that
        // it created child components correctly, ie  Angular detail grid can have Angular cell renderer.
        // this is only used by Angular and Vue, as React uses native React AG Grid detail grids
        const parentFrameworkComponentWrapper = this.context.getBean('frameworkComponentWrapper');
        const frameworkComponentWrapper = new DetailFrameworkComponentWrapper(parentFrameworkComponentWrapper);
        const { frameworkOverrides } = this.beans;

        const api = createGrid(this.eDetailGrid, gridOptions, {
            frameworkOverrides,
            providedBeanInstances: {
                frameworkComponentWrapper: frameworkComponentWrapper,
            },
            modules: _getGridRegisteredModules(this.params.api.getGridId(), gridOptions.rowModelType ?? 'clientSide'),
        } as GridParams);

        this.detailApi = api;
        this.ctrl.registerDetailWithMaster(api);

        this.addDestroyFunc(() => {
            api?.destroy();
        });
    }

    private setRowData(rowData: any[]): void {
        // ensure detail grid api still exists (grid may be destroyed when async call tries to set data)
        this.detailApi && this.detailApi.setGridOption('rowData', rowData);
    }
}
