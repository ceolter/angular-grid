import type {
    AgColumn,
    BeanCollection,
    ColumnModel,
    ColumnNameService,
    DragAndDropIcon,
    DragItem,
    DropTarget,
    FuncColsService,
    IAggFuncService,
    PopupService,
    SortIndicatorComp,
    SortService,
} from 'ag-grid-community';
import { Component, DragSourceType, KeyCode, RefPlaceholder, _loadTemplate } from 'ag-grid-community';

import { PillDragComp } from '../../widgets/pillDragComp';
import { VirtualList } from '../../widgets/virtualList';
import { isRowGroupColLocked } from '../rowGroupingUtils';
import type { TDropZone } from './baseDropZonePanel';

export class DropZoneColumnComp extends PillDragComp<AgColumn> {
    private popupSvc: PopupService;
    private sortSvc?: SortService;
    private colModel: ColumnModel;
    private colNames: ColumnNameService;
    private funcColsSvc: FuncColsService;
    private aggFuncSvc?: IAggFuncService;

    public override wireBeans(beans: BeanCollection) {
        super.wireBeans(beans);
        this.popupSvc = beans.popupSvc!;
        this.sortSvc = beans.sortSvc;
        this.colModel = beans.colModel;
        this.colNames = beans.colNames;
        this.funcColsSvc = beans.funcColsSvc;
        this.aggFuncSvc = beans.aggFuncSvc;
    }

    private readonly eSortIndicator: SortIndicatorComp = RefPlaceholder;

    private displayName: string | null;
    private popupShowing = false;

    constructor(
        private column: AgColumn,
        dragSourceDropTarget: DropTarget,
        ghost: boolean,
        private dropZonePurpose: TDropZone,
        horizontal: boolean
    ) {
        super(dragSourceDropTarget, ghost, horizontal);
    }

    public override postConstruct(): void {
        this.template = /* html */ `
            <span role="option">
                <span data-ref="eDragHandle" class="ag-drag-handle ag-column-drop-cell-drag-handle" role="presentation"></span>
                <span data-ref="eText" class="ag-column-drop-cell-text" aria-hidden="true"></span>
                ${this.sortSvc ? '<ag-sort-indicator data-ref="eSortIndicator"></ag-sort-indicator>' : ''}
                <span data-ref="eButton" class="ag-column-drop-cell-button" role="presentation"></span>
            </span>
        `;
        if (this.sortSvc) {
            this.agComponents = [this.sortSvc.getSortIndicatorSelector()];
        }

        this.displayName = this.colNames.getDisplayNameForColumn(this.column, 'columnDrop');

        super.postConstruct();

        if (this.sortSvc) {
            this.setupSort();

            this.addManagedEventListeners({
                sortChanged: () => {
                    this.setupAria();
                },
            });
        }

        if (this.isGroupingZone()) {
            this.addManagedPropertyListener('groupLockGroupColumns', () => {
                this.refreshRemove();
                this.refreshDraggable();
                this.setupAria();
            });
        }
    }

    public getItem(): AgColumn {
        return this.column;
    }

    protected getDisplayName(): string {
        return this.displayName!;
    }

    protected getTooltip(): string | null | undefined {
        return this.column.getColDef().headerTooltip;
    }

    protected override addAdditionalAriaInstructions(
        ariaInstructions: string[],
        translate: (key: string, defaultValue: string) => string
    ): void {
        const isSortSuppressed = this.gos.get('rowGroupPanelSuppressSort');
        const isFunctionsReadOnly = this.gos.get('functionsReadOnly');
        if (this.isAggregationZone() && !isFunctionsReadOnly) {
            const aggregationMenuAria = translate(
                'ariaDropZoneColumnValueItemDescription',
                'Press ENTER to change the aggregation type'
            );
            ariaInstructions.push(aggregationMenuAria);
        }

        if (this.isGroupingZone() && this.column.isSortable() && !isSortSuppressed) {
            const sortProgressAria = translate('ariaDropZoneColumnGroupItemDescription', 'Press ENTER to sort');
            ariaInstructions.push(sortProgressAria);
        }

        super.addAdditionalAriaInstructions(ariaInstructions, translate);
    }

    protected override isDraggable(): boolean {
        return this.isReadOnly();
    }

    protected override isRemovable(): boolean {
        return this.isReadOnly();
    }

    private isReadOnly(): boolean {
        return !this.isGroupingAndLocked() && !this.gos.get('functionsReadOnly');
    }

    protected getAriaDisplayName(): string {
        const translate = this.getLocaleTextFunc();

        const { name, aggFuncName } = this.getColumnAndAggFuncName();
        const aggSeparator = translate('ariaDropZoneColumnComponentAggFuncSeparator', ' of ');
        const sortDirection = {
            asc: translate('ariaDropZoneColumnComponentSortAscending', 'ascending'),
            desc: translate('ariaDropZoneColumnComponentSortDescending', 'descending'),
        };
        const columnSort = this.column.getSort();
        const isSortSuppressed = this.gos.get('rowGroupPanelSuppressSort');
        return [
            aggFuncName && `${aggFuncName}${aggSeparator}`,
            name,
            this.isGroupingZone() && !isSortSuppressed && columnSort && `, ${sortDirection[columnSort]}`,
        ]
            .filter((part) => !!part)
            .join('');
    }

    private getColumnAndAggFuncName(): { name: string; aggFuncName: string } {
        const name = this.displayName as string;
        let aggFuncName: string = '';

        if (this.isAggregationZone()) {
            const aggFunc = this.column.getAggFunc();
            // if aggFunc is a string, we can use it, but if it's a function, then we swap with 'func'
            const aggFuncString = typeof aggFunc === 'string' ? aggFunc : 'agg';
            const localeTextFunc = this.getLocaleTextFunc();
            aggFuncName = localeTextFunc(aggFuncString, aggFuncString);
        }

        return { name, aggFuncName };
    }

    private setupSort(): void {
        if (!this.column.isSortable() || !this.isGroupingZone()) {
            return;
        }

        if (!this.gos.get('rowGroupPanelSuppressSort')) {
            this.eSortIndicator.setupSort(this.column, true);
            const performSort = (event: MouseEvent | KeyboardEvent) => {
                event.preventDefault();
                this.sortSvc!.progressSortFromEvent(this.column, event);
            };

            this.addGuiEventListener('click', performSort);
            this.addGuiEventListener('keydown', (e: KeyboardEvent) => {
                const isEnter = e.key === KeyCode.ENTER;
                if (isEnter && this.isGroupingZone()) {
                    performSort(e);
                }
            });
        }
    }

    protected override getDefaultIconName(): DragAndDropIcon {
        return 'hide';
    }

    protected createGetDragItem(): () => DragItem {
        const { column } = this;
        return () => {
            const visibleState: { [key: string]: boolean } = {};
            visibleState[column.getId()] = column.isVisible();
            return {
                columns: [column],
                visibleState: visibleState,
            };
        };
    }

    protected override setupComponents(): void {
        super.setupComponents();

        if (this.isAggregationZone() && !this.gos.get('functionsReadOnly')) {
            this.addGuiEventListener('click', this.onShowAggFuncSelection.bind(this));
        }
    }

    protected override onKeyDown(e: KeyboardEvent): void {
        super.onKeyDown(e);

        const isEnter = e.key === KeyCode.ENTER;
        if (isEnter && this.isAggregationZone() && !this.gos.get('functionsReadOnly')) {
            e.preventDefault();
            this.onShowAggFuncSelection();
        }
    }

    protected override getDisplayValue(): string {
        const { name, aggFuncName } = this.getColumnAndAggFuncName();
        return this.isAggregationZone() ? `${aggFuncName}(${name})` : name;
    }

    private onShowAggFuncSelection(): void {
        if (this.popupShowing) {
            return;
        }

        this.popupShowing = true;

        const virtualList = new VirtualList({ cssIdentifier: 'select-agg-func' });
        const rows = this.aggFuncSvc!.getFuncNames(this.column);
        const eGui = this.getGui();
        const virtualListGui = virtualList.getGui();

        virtualList.setModel({
            getRow: function (index: number) {
                return rows[index];
            },
            getRowCount: function () {
                return rows.length;
            },
        });

        this.createBean(virtualList);

        const ePopup = _loadTemplate(/* html*/ `<div class="ag-select-agg-func-popup"></div>`);
        ePopup.style.top = '0px';
        ePopup.style.left = '0px';
        ePopup.appendChild(virtualListGui);
        ePopup.style.width = `${eGui.clientWidth}px`;

        const [focusoutListener] = this.addManagedElementListeners(ePopup, {
            focusout: (e: FocusEvent) => {
                if (!ePopup.contains(e.relatedTarget as HTMLElement) && addPopupRes) {
                    addPopupRes.hideFunc();
                }
            },
        });

        const popupHiddenFunc = (callbackEvent?: KeyboardEvent) => {
            this.destroyBean(virtualList);
            this.popupShowing = false;

            if (callbackEvent?.key === 'Escape') {
                eGui.focus();
            }

            if (focusoutListener) {
                focusoutListener();
            }
        };

        const translate = this.getLocaleTextFunc();

        const addPopupRes = this.popupSvc.addPopup({
            modal: true,
            eChild: ePopup,
            closeOnEsc: true,
            closedCallback: popupHiddenFunc,
            ariaLabel: translate('ariaLabelAggregationFunction', 'Aggregation Function'),
        });

        if (addPopupRes) {
            virtualList.setComponentCreator(this.createAggSelect.bind(this, addPopupRes.hideFunc));
        }

        virtualList.addGuiEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
                const row = virtualList.getLastFocusedRow();

                if (row == null) {
                    return;
                }

                const comp = virtualList.getComponentAt(row) as AggItemComp;

                if (comp) {
                    comp.selectItem();
                }
            }
        });

        this.popupSvc.positionPopupByComponent({
            type: 'aggFuncSelect',
            eventSource: eGui,
            ePopup: ePopup,
            keepWithinBounds: true,
            column: this.column,
            position: 'under',
        });

        virtualList.refresh();

        let rowToFocus = rows.findIndex((r) => r === this.column.getAggFunc());
        if (rowToFocus === -1) {
            rowToFocus = 0;
        }

        virtualList.focusRow(rowToFocus);
    }

    private createAggSelect(hidePopup: () => void, value: any): Component {
        const itemSelected = () => {
            hidePopup();
            this.getGui().focus();
            this.funcColsSvc.setColumnAggFunc(this.column, value, 'toolPanelDragAndDrop');
        };

        const localeTextFunc = this.getLocaleTextFunc();
        const aggFuncString = value.toString();
        const aggFuncStringTranslated = localeTextFunc(aggFuncString, aggFuncString);
        const comp = new AggItemComp(itemSelected, aggFuncStringTranslated);

        return comp;
    }

    private isGroupingAndLocked(): boolean {
        return this.isGroupingZone() && isRowGroupColLocked(this.funcColsSvc, this.gos, this.column);
    }

    private isAggregationZone() {
        return this.dropZonePurpose === 'aggregation';
    }

    private isGroupingZone() {
        return this.dropZonePurpose === 'rowGroup';
    }

    protected getDragSourceType(): DragSourceType {
        return DragSourceType.ToolPanel;
    }

    public override destroy(): void {
        super.destroy();
        (this.column as any) = null;
    }
}

class AggItemComp extends Component {
    public selectItem: () => void;

    constructor(itemSelected: () => void, value: string) {
        super(/* html */ `<div class="ag-select-agg-func-item"/>`);
        this.selectItem = itemSelected;
        this.getGui().innerText = value;
        this.addGuiEventListener('click', this.selectItem);
    }
}
