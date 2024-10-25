import type {
    AgCheckbox,
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColumnEventType,
    ColumnModel,
    DragAndDropService,
    DragItem,
    DragSource,
    IAggFunc,
    ITooltipCtrl,
    Registry,
    TooltipFeature,
} from 'ag-grid-community';
import {
    AgCheckboxSelector,
    Component,
    DragSourceType,
    KeyCode,
    RefPlaceholder,
    TouchListener,
    _createIcon,
    _createIconNoSpan,
    _getShouldDisplayTooltip,
    _getToolPanelClassesFromColDef,
    _setAriaDescribedBy,
    _setAriaExpanded,
    _setAriaLabel,
    _setDisplayed,
} from 'ag-grid-community';

import type { ColumnModelItem } from './columnModelItem';
import type { ModelItemUtils } from './modelItemUtils';
import { ToolPanelContextMenu } from './toolPanelContextMenu';

export class ToolPanelColumnGroupComp extends Component {
    private colModel: ColumnModel;
    private dragAndDrop: DragAndDropService;
    private modelItemUtils: ModelItemUtils;
    private registry: Registry;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
        this.dragAndDrop = beans.dragAndDrop!;
        this.modelItemUtils = beans.modelItemUtils as ModelItemUtils;
        this.registry = beans.registry;
    }

    private readonly cbSelect: AgCheckbox = RefPlaceholder;
    private readonly eLabel: HTMLElement = RefPlaceholder;

    private readonly eGroupOpenedIcon: Element = RefPlaceholder;
    private readonly eGroupClosedIcon: Element = RefPlaceholder;
    private readonly eColumnGroupIcons: Element = RefPlaceholder;

    private eDragHandle: Element;

    private readonly columnGroup: AgProvidedColumnGroup;
    private readonly columnDept: number;

    private displayName: string | null;
    private processingColumnStateChange = false;
    private tooltipFeature?: TooltipFeature;

    constructor(
        private readonly modelItem: ColumnModelItem,
        private readonly allowDragging: boolean,
        private readonly eventType: ColumnEventType,
        private readonly focusWrapper: HTMLElement
    ) {
        super();
        this.modelItem = modelItem;
        this.columnGroup = modelItem.getColumnGroup();
        this.columnDept = modelItem.getDept();
        this.displayName = modelItem.getDisplayName();
        this.allowDragging = allowDragging;
    }

    public postConstruct(): void {
        this.setTemplate(
            /* html */
            `<div class="ag-column-select-column-group">
                <span class="ag-column-group-icons" data-ref="eColumnGroupIcons" >
                    <span class="ag-column-group-closed-icon" data-ref="eGroupClosedIcon"></span>
                    <span class="ag-column-group-opened-icon" data-ref="eGroupOpenedIcon"></span>
                </span>
                <ag-checkbox data-ref="cbSelect" class="ag-column-select-checkbox"></ag-checkbox>
                <span class="ag-column-select-column-label" data-ref="eLabel"></span>
            </div>`,
            [AgCheckboxSelector]
        );

        this.eDragHandle = _createIconNoSpan('columnDrag', this.beans)!;
        this.eDragHandle.classList.add('ag-drag-handle', 'ag-column-select-column-group-drag-handle');

        const checkboxGui = this.cbSelect.getGui();
        const checkboxInput = this.cbSelect.getInputElement();

        checkboxGui.insertAdjacentElement('afterend', this.eDragHandle);
        checkboxInput.setAttribute('tabindex', '-1');

        this.eLabel.innerHTML = this.displayName ? this.displayName : '';
        this.setupExpandContract();

        this.addCssClass('ag-column-select-indent-' + this.columnDept);
        this.getGui().style.setProperty('--ag-indentation-level', String(this.columnDept));

        this.tooltipFeature = this.createOptionalManagedBean(
            this.registry.createDynamicBean<TooltipFeature>('tooltipFeature', {
                getGui: () => this.getGui(),
                getLocation: () => 'columnToolPanelColumnGroup',
                shouldDisplayTooltip: _getShouldDisplayTooltip(this.gos, () => this.eLabel),
            } as ITooltipCtrl)
        );

        this.addManagedEventListeners({ columnPivotModeChanged: this.onColumnStateChanged.bind(this) });

        this.addManagedElementListeners(this.eLabel, { click: this.onLabelClicked.bind(this) });
        this.addManagedListeners(this.cbSelect, { fieldValueChanged: this.onCheckboxChanged.bind(this) });
        this.addManagedListeners(this.modelItem, { expandedChanged: this.onExpandChanged.bind(this) });
        this.addManagedListeners(this.focusWrapper, {
            keydown: this.handleKeyDown.bind(this),
            contextmenu: this.onContextMenu.bind(this),
        });

        this.setOpenClosedIcons();
        this.setupDragging();
        this.onColumnStateChanged();
        this.addVisibilityListenersToAllChildren();
        this.refreshAriaExpanded();
        this.refreshAriaLabel();
        this.setupTooltip();

        const classes = _getToolPanelClassesFromColDef(
            this.columnGroup.getColGroupDef(),
            this.gos,
            null,
            this.columnGroup
        );
        classes.forEach((c) => this.addOrRemoveCssClass(c, true));
    }

    public getColumns(): AgColumn[] {
        return this.columnGroup.getLeafColumns();
    }

    private setupTooltip(): void {
        const colGroupDef = this.columnGroup.getColGroupDef();

        if (!colGroupDef) {
            return;
        }

        const refresh = () => this.tooltipFeature?.setTooltipAndRefresh(colGroupDef.headerTooltip);

        refresh();

        this.addManagedEventListeners({ newColumnsLoaded: refresh });
    }

    private handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case KeyCode.LEFT:
                e.preventDefault();
                this.modelItem.setExpanded(false);
                break;
            case KeyCode.RIGHT:
                e.preventDefault();
                this.modelItem.setExpanded(true);
                break;
            case KeyCode.SPACE:
                e.preventDefault();
                if (this.isSelectable()) {
                    this.onSelectAllChanged(!this.isSelected());
                }
                break;
        }
    }

    private onContextMenu(e: MouseEvent): void {
        const { columnGroup, gos } = this;

        if (gos.get('functionsReadOnly')) {
            return;
        }

        const contextMenu = this.createBean(new ToolPanelContextMenu(columnGroup, e, this.focusWrapper));
        this.addDestroyFunc(() => {
            if (contextMenu.isAlive()) {
                this.destroyBean(contextMenu);
            }
        });
    }

    private addVisibilityListenersToAllChildren(): void {
        const listener = this.onColumnStateChanged.bind(this);
        this.columnGroup.getLeafColumns().forEach((column) => {
            this.addManagedListeners(column, {
                visibleChanged: listener,
                columnValueChanged: listener,
                columnPivotChanged: listener,
                columnRowGroupChanged: listener,
            });
        });
    }

    private setupDragging(): void {
        if (!this.allowDragging) {
            _setDisplayed(this.eDragHandle, false);
            return;
        }

        let hideColumnOnExit = !this.gos.get('suppressDragLeaveHidesColumns');
        const dragSource: DragSource = {
            type: DragSourceType.ToolPanel,
            eElement: this.eDragHandle,
            dragItemName: this.displayName,
            getDefaultIconName: () => (hideColumnOnExit ? 'hide' : 'notAllowed'),
            getDragItem: () => this.createDragItem(),
            onDragStarted: () => {
                hideColumnOnExit = !this.gos.get('suppressDragLeaveHidesColumns');
                this.eventSvc.dispatchEvent({
                    type: 'columnPanelItemDragStart',
                    column: this.columnGroup,
                });
            },
            onDragStopped: () => {
                this.eventSvc.dispatchEvent({
                    type: 'columnPanelItemDragEnd',
                });
            },
            onGridEnter: (dragItem: DragItem | null) => {
                if (hideColumnOnExit) {
                    // when dragged into the grid, restore the state that was active pre-drag
                    this.modelItemUtils.updateColumns({
                        columns: this.columnGroup.getLeafColumns(),
                        visibleState: dragItem?.visibleState,
                        pivotState: dragItem?.pivotState,
                        eventType: this.eventType,
                    });
                }
            },
            onGridExit: () => {
                if (hideColumnOnExit) {
                    // when dragged outside of the grid, mimic what happens when checkbox is disabled
                    // this handles the behaviour for pivot which is different to just hiding a column.
                    this.onChangeCommon(false);
                }
            },
        };

        this.dragAndDrop.addDragSource(dragSource, true);
        this.addDestroyFunc(() => this.dragAndDrop.removeDragSource(dragSource));
    }

    private createDragItem() {
        const columns = this.columnGroup.getLeafColumns();
        const visibleState: { [key: string]: boolean } = {};
        const pivotState: {
            [key: string]: {
                pivot?: boolean;
                rowGroup?: boolean;
                aggFunc?: string | IAggFunc | null;
            };
        } = {};
        columns.forEach((col) => {
            const colId = col.getId();
            visibleState[colId] = col.isVisible();
            pivotState[colId] = this.modelItemUtils.createPivotState(col);
        });

        return {
            columns,
            visibleState,
            pivotState,
        };
    }

    private setupExpandContract(): void {
        this.eGroupClosedIcon.appendChild(_createIcon('columnSelectClosed', this.beans, null));
        this.eGroupOpenedIcon.appendChild(_createIcon('columnSelectOpen', this.beans, null));

        const listener = this.onExpandOrContractClicked.bind(this);
        this.addManagedElementListeners(this.eGroupClosedIcon, { click: listener });
        this.addManagedElementListeners(this.eGroupOpenedIcon, { click: listener });

        const touchListener = new TouchListener(this.eColumnGroupIcons, true);
        this.addManagedListeners(touchListener, { tap: listener });
        this.addDestroyFunc(touchListener.destroy.bind(touchListener));
    }

    private onLabelClicked(): void {
        const nextState = !this.cbSelect.getValue();
        this.onChangeCommon(nextState);
    }

    private onCheckboxChanged(event: any): void {
        this.onChangeCommon(event.selected);
    }

    private getVisibleLeafColumns(): AgColumn[] {
        const childColumns: AgColumn[] = [];

        const extractCols = (children: ColumnModelItem[]) => {
            children.forEach((child) => {
                if (!child.isPassesFilter()) {
                    return;
                }
                if (child.isGroup()) {
                    extractCols(child.getChildren());
                } else {
                    childColumns.push(child.getColumn());
                }
            });
        };

        extractCols(this.modelItem.getChildren());

        return childColumns;
    }

    private onChangeCommon(nextState: boolean): void {
        this.refreshAriaLabel();

        if (this.processingColumnStateChange) {
            return;
        }

        this.modelItemUtils.selectAllChildren(this.modelItem.getChildren(), nextState, this.eventType);
    }

    private refreshAriaLabel(): void {
        const translate = this.getLocaleTextFunc();
        const columnLabel = translate('ariaColumnGroup', 'Column Group');
        const checkboxValue = this.cbSelect.getValue();
        const state =
            checkboxValue === undefined
                ? translate('ariaIndeterminate', 'indeterminate')
                : checkboxValue
                  ? translate('ariaVisible', 'visible')
                  : translate('ariaHidden', 'hidden');
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');

        _setAriaLabel(this.focusWrapper, `${this.displayName} ${columnLabel}`);
        this.cbSelect.setInputAriaLabel(`${visibilityLabel} (${state})`);
        _setAriaDescribedBy(this.focusWrapper, this.cbSelect.getInputElement().id);
    }

    public onColumnStateChanged(): void {
        const selectedValue = this.workOutSelectedValue();
        const readOnlyValue = this.workOutReadOnlyValue();
        this.processingColumnStateChange = true;
        this.cbSelect.setValue(selectedValue);
        this.cbSelect.setReadOnly(readOnlyValue);
        this.addOrRemoveCssClass('ag-column-select-column-group-readonly', readOnlyValue);
        this.processingColumnStateChange = false;
    }

    private workOutSelectedValue(): boolean | undefined {
        const pivotMode = this.colModel.isPivotMode();

        const visibleLeafColumns = this.getVisibleLeafColumns();

        let checkedCount = 0;
        let uncheckedCount = 0;

        visibleLeafColumns.forEach((column) => {
            if (!pivotMode && column.getColDef().lockVisible) {
                return;
            }

            if (this.isColumnChecked(column, pivotMode)) {
                checkedCount++;
            } else {
                uncheckedCount++;
            }
        });

        if (checkedCount > 0 && uncheckedCount > 0) {
            return undefined;
        }

        return checkedCount > 0;
    }

    private workOutReadOnlyValue(): boolean {
        const pivotMode = this.colModel.isPivotMode();

        let colsThatCanAction = 0;

        this.columnGroup.getLeafColumns().forEach((col) => {
            if (pivotMode) {
                if (col.isAnyFunctionAllowed()) {
                    colsThatCanAction++;
                }
            } else {
                if (!col.getColDef().lockVisible) {
                    colsThatCanAction++;
                }
            }
        });

        return colsThatCanAction === 0;
    }

    private isColumnChecked(column: AgColumn, pivotMode: boolean): boolean {
        if (pivotMode) {
            const pivoted = column.isPivotActive();
            const grouped = column.isRowGroupActive();
            const aggregated = column.isValueActive();
            return pivoted || grouped || aggregated;
        }

        return column.isVisible();
    }

    private onExpandOrContractClicked(): void {
        const oldState = this.modelItem.isExpanded();
        this.modelItem.setExpanded(!oldState);
    }

    private onExpandChanged() {
        this.setOpenClosedIcons();
        this.refreshAriaExpanded();
    }

    private setOpenClosedIcons(): void {
        const folderOpen = this.modelItem.isExpanded();
        _setDisplayed(this.eGroupClosedIcon, !folderOpen);
        _setDisplayed(this.eGroupOpenedIcon, folderOpen);
    }

    private refreshAriaExpanded(): void {
        _setAriaExpanded(this.focusWrapper, this.modelItem.isExpanded());
    }

    public getDisplayName(): string | null {
        return this.displayName;
    }

    public onSelectAllChanged(value: boolean): void {
        const cbValue = this.cbSelect.getValue();
        const readOnly = this.cbSelect.isReadOnly();

        if (!readOnly && ((value && !cbValue) || (!value && cbValue))) {
            this.cbSelect.toggle();
        }
    }

    public isSelected(): boolean | undefined {
        return this.cbSelect.getValue();
    }

    public isSelectable(): boolean {
        return !this.cbSelect.isReadOnly();
    }

    public setSelected(selected: boolean) {
        this.cbSelect.setValue(selected, true);
    }
}
