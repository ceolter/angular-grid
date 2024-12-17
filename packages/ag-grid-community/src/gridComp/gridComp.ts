import type { GridBodyComp } from '../gridBodyComp/gridBodyComp';
import { GridBodySelector } from '../gridBodyComp/gridBodyComp';
import type { FocusableContainer } from '../interfaces/iFocusableContainer';
import type { ISideBar } from '../interfaces/iSideBar';
import type { UpdateLayoutClassesParams } from '../styling/layoutFeature';
import { LayoutCssClasses } from '../styling/layoutFeature';
import { _isVisible } from '../utils/dom';
import { _logIfDebug } from '../utils/function';
import type { ComponentSelector } from '../widgets/component';
import { RefPlaceholder } from '../widgets/component';
import type { Component } from '../widgets/component';
import { TabGuardComp } from '../widgets/tabGuardComp';
import type { IGridComp, OptionalGridComponents } from './gridCtrl';
import { GridCtrl } from './gridCtrl';

export class GridComp extends TabGuardComp {
    private readonly gridBody: GridBodyComp = RefPlaceholder;
    private readonly sideBar: ISideBar & Component = RefPlaceholder;
    private readonly pagination: TabGuardComp = RefPlaceholder;
    private readonly rootWrapperBody: HTMLElement = RefPlaceholder;

    private eGridDiv: HTMLElement;

    constructor(eGridDiv: HTMLElement) {
        super();
        this.eGridDiv = eGridDiv;
    }

    public postConstruct(): void {
        const compProxy: IGridComp = {
            destroyGridUi: () => this.destroyBean(this),
            setRtlClass: (cssClass: string) => this.addCssClass(cssClass),
            forceFocusOutOfContainer: this.forceFocusOutOfContainer.bind(this),
            updateLayoutClasses: this.updateLayoutClasses.bind(this),
            getFocusableContainers: this.getFocusableContainers.bind(this),
            setUserSelect: (value) => {
                this.getGui().style.userSelect = value != null ? value : '';
                this.getGui().style.webkitUserSelect = value != null ? value : '';
            },
            setCursor: (value) => {
                this.getGui().style.cursor = value != null ? value : '';
            },
        };

        const ctrl = this.createManagedBean(new GridCtrl());
        const comps = ctrl.getOptionalSelectors();
        const template = this.createTemplate(comps);
        const requiredComps = [GridBodySelector, ...Object.values(comps).filter((c) => !!c)] as ComponentSelector[];
        this.setTemplate(template, requiredComps);

        ctrl.setComp(compProxy, this.eGridDiv, this.getGui());

        this.insertGridIntoDom();

        this.initialiseTabGuard({
            // we want to override the default behaviour to do nothing for onTabKeyDown
            onTabKeyDown: () => undefined,
            focusInnerElement: (fromBottom) => ctrl.focusInnerElement(fromBottom),
            forceFocusOutWhenTabGuardsAreEmpty: true,
            isEmpty: () => !ctrl.isFocusable(),
        });
    }

    private insertGridIntoDom(): void {
        const eGui = this.getGui();
        this.eGridDiv.appendChild(eGui);
        this.addDestroyFunc(() => {
            this.eGridDiv.removeChild(eGui);
            _logIfDebug(this.gos, 'Grid removed from DOM');
        });
    }

    private updateLayoutClasses(cssClass: string, params: UpdateLayoutClassesParams): void {
        const eRootWrapperBodyClassList = this.rootWrapperBody.classList;
        const { AUTO_HEIGHT, NORMAL, PRINT } = LayoutCssClasses;
        const { autoHeight, normal, print } = params;
        eRootWrapperBodyClassList.toggle(AUTO_HEIGHT, autoHeight);
        eRootWrapperBodyClassList.toggle(NORMAL, normal);
        eRootWrapperBodyClassList.toggle(PRINT, print);

        this.addOrRemoveCssClass(AUTO_HEIGHT, autoHeight);
        this.addOrRemoveCssClass(NORMAL, normal);
        this.addOrRemoveCssClass(PRINT, print);
    }

    private createTemplate(params: OptionalGridComponents): string {
        const dropZones = params.gridHeaderDropZonesSelector
            ? '<ag-grid-header-drop-zones></ag-grid-header-drop-zones>'
            : '';
        const sideBar = params.sideBarSelector ? '<ag-side-bar data-ref="sideBar"></ag-side-bar>' : '';
        const statusBar = params.statusBarSelector ? '<ag-status-bar></ag-status-bar>' : '';
        const watermark = params.watermarkSelector ? '<ag-watermark></ag-watermark>' : '';
        const pagination = params.paginationSelector ? '<ag-pagination data-ref="pagination"></ag-pagination>' : '';

        const template =
            /* html */
            `<div class="ag-root-wrapper" role="presentation">
                ${dropZones}
                <div class="ag-root-wrapper-body" data-ref="rootWrapperBody" role="presentation">
                    <ag-grid-body data-ref="gridBody"></ag-grid-body>
                    ${sideBar}
                </div>
                ${statusBar}
                ${pagination}
                ${watermark}
            </div>`;

        return template;
    }

    public override getFocusableElement(): HTMLElement {
        return this.rootWrapperBody;
    }

    public override forceFocusOutOfContainer(up: boolean = false): void {
        if (!up && this.pagination?.isDisplayed()) {
            this.pagination.forceFocusOutOfContainer(up);
            return;
        }
        super.forceFocusOutOfContainer(up);
    }

    protected getFocusableContainers(): FocusableContainer[] {
        const focusableContainers: FocusableContainer[] = [this.gridBody];

        [this.sideBar, this.pagination].forEach((comp) => {
            if (comp) {
                focusableContainers.push(comp);
            }
        });

        return focusableContainers.filter((el) => _isVisible(el.getGui()));
    }
}
