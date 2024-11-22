import type {
    AgCheckbox,
    AgColumn,
    AgProvidedColumnGroup,
    ColumnEventType,
    DragItem,
    DragSource,
    IAggFunc,
    ITooltipCtrl,
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
import { createPivotState, selectAllChildren, updateColumns } from './modelItemUtils';
import { ToolPanelContextMenu } from './toolPanelContextMenu';

export class ToolPanelColumnGroupComp extends Component {
    private readonly cbSelect: AgCheckbox = RefPlaceholder;
    private readonly eLabel: HTMLElement = RefPlaceholder;

    private readonly eGroupOpenedIcon: Element = RefPlaceholder;
    private readonly eGroupClosedIcon: Element = RefPlaceholder;
    private readonly eColumnGroupIcons: Element = RefPlaceholder;

    private eDragHandle: Element;

    private readonly columnGroup: AgProvidedColumnGroup;
    private readonly columnDepth: number;

    private readonly displayName: string | null;
    private processingColumnStateChange = false;
    private tooltipFeature?: TooltipFeature;

    constructor(
        private readonly modelItem: ColumnModelItem,
        private readonly allowDragging: boolean,
        private readonly eventType: ColumnEventType,
        private readonly focusWrapper: HTMLElement
    ) {
        super();
        const { columnGroup, depth, displayName } = modelItem;
        this.columnGroup = columnGroup;
        this.columnDepth = depth;
        this.displayName = displayName;
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

        const {
            beans,
            cbSelect,
            eLabel,
            displayName,
            columnDepth: columnDept,
            modelItem,
            focusWrapper,
            columnGroup,
        } = this;
        const { registry, gos } = beans;

        const eDragHandle = _createIconNoSpan('columnDrag', beans)!;
        this.eDragHandle = eDragHandle;
        eDragHandle.classList.add('ag-drag-handle', 'ag-column-select-column-group-drag-handle');

        const checkboxGui = cbSelect.getGui();
        const checkboxInput = cbSelect.getInputElement();

        checkboxGui.insertAdjacentElement('afterend', eDragHandle);
        checkboxInput.setAttribute('tabindex', '-1');

        eLabel.innerHTML = displayName ?? '';
        this.setupExpandContract();

        this.addCssClass('ag-column-select-indent-' + columnDept);
        this.getGui().style.setProperty('--ag-indentation-level', String(columnDept));

        this.tooltipFeature = this.createOptionalManagedBean(
            registry.createDynamicBean<TooltipFeature>('tooltipFeature', false, {
                getGui: () => this.getGui(),
                getLocation: () => 'columnToolPanelColumnGroup',
                shouldDisplayTooltip: _getShouldDisplayTooltip(gos, () => eLabel),
            } as ITooltipCtrl)
        );

        this.addManagedEventListeners({ columnPivotModeChanged: this.onColumnStateChanged.bind(this) });

        this.addManagedElementListeners(eLabel, { click: this.onLabelClicked.bind(this) });
        this.addManagedListeners(cbSelect, { fieldValueChanged: this.onCheckboxChanged.bind(this) });
        this.addManagedListeners(modelItem, { expandedChanged: this.onExpandChanged.bind(this) });
        this.addManagedListeners(focusWrapper, {
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

        const classes = _getToolPanelClassesFromColDef(columnGroup.getColGroupDef(), gos, null, columnGroup);
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
                this.modelItem.expanded = false;
                break;
            case KeyCode.RIGHT:
                e.preventDefault();
                this.modelItem.expanded = true;
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

        const beans = this.beans;
        const { gos, eventSvc, dragAndDrop } = beans;

        let hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
        const dragSource: DragSource = {
            type: DragSourceType.ToolPanel,
            eElement: this.eDragHandle,
            dragItemName: this.displayName,
            getDefaultIconName: () => (hideColumnOnExit ? 'hide' : 'notAllowed'),
            getDragItem: () => this.createDragItem(),
            onDragStarted: () => {
                hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
                eventSvc.dispatchEvent({
                    type: 'columnPanelItemDragStart',
                    column: this.columnGroup,
                });
            },
            onDragStopped: () => {
                eventSvc.dispatchEvent({
                    type: 'columnPanelItemDragEnd',
                });
            },
            onGridEnter: (dragItem: DragItem | null) => {
                if (hideColumnOnExit) {
                    // when dragged into the grid, restore the state that was active pre-drag
                    updateColumns(beans, {
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

        dragAndDrop!.addDragSource(dragSource, true);
        this.addDestroyFunc(() => dragAndDrop!.removeDragSource(dragSource));
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
            pivotState[colId] = createPivotState(col);
        });

        return {
            columns,
            visibleState,
            pivotState,
        };
    }

    private setupExpandContract(): void {
        const { beans, eGroupClosedIcon, eGroupOpenedIcon, eColumnGroupIcons } = this;
        eGroupClosedIcon.appendChild(_createIcon('columnSelectClosed', beans, null));
        eGroupOpenedIcon.appendChild(_createIcon('columnSelectOpen', beans, null));

        const listener = this.onExpandOrContractClicked.bind(this);
        this.addManagedElementListeners(eGroupClosedIcon, { click: listener });
        this.addManagedElementListeners(eGroupOpenedIcon, { click: listener });

        const touchListener = new TouchListener(eColumnGroupIcons, true);
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
                if (!child.passesFilter) {
                    return;
                }
                if (child.group) {
                    extractCols(child.children);
                } else {
                    childColumns.push(child.column);
                }
            });
        };

        extractCols(this.modelItem.children);

        return childColumns;
    }

    private onChangeCommon(nextState: boolean): void {
        this.refreshAriaLabel();

        if (this.processingColumnStateChange) {
            return;
        }

        selectAllChildren(this.beans, this.modelItem.children, nextState, this.eventType);
    }

    private refreshAriaLabel(): void {
        const { cbSelect, focusWrapper, displayName } = this;
        const translate = this.getLocaleTextFunc();
        const columnLabel = translate('ariaColumnGroup', 'Column Group');
        const checkboxValue = cbSelect.getValue();
        const state =
            checkboxValue === undefined
                ? translate('ariaIndeterminate', 'indeterminate')
                : checkboxValue
                  ? translate('ariaVisible', 'visible')
                  : translate('ariaHidden', 'hidden');
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');

        _setAriaLabel(focusWrapper, `${displayName} ${columnLabel}`);
        cbSelect.setInputAriaLabel(`${visibilityLabel} (${state})`);
        _setAriaDescribedBy(focusWrapper, cbSelect.getInputElement().id);
    }

    public onColumnStateChanged(): void {
        const selectedValue = this.workOutSelectedValue();
        const readOnlyValue = this.workOutReadOnlyValue();
        this.processingColumnStateChange = true;
        const cbSelect = this.cbSelect;
        cbSelect.setValue(selectedValue);
        cbSelect.setReadOnly(readOnlyValue);
        this.addOrRemoveCssClass('ag-column-select-column-group-readonly', readOnlyValue);
        this.processingColumnStateChange = false;
    }

    private workOutSelectedValue(): boolean | undefined {
        const pivotMode = this.beans.colModel.isPivotMode();

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
        const pivotMode = this.beans.colModel.isPivotMode();

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
        const modelItem = this.modelItem;
        const oldState = modelItem.expanded;
        modelItem.expanded = !oldState;
    }

    private onExpandChanged() {
        this.setOpenClosedIcons();
        this.refreshAriaExpanded();
    }

    private setOpenClosedIcons(): void {
        const folderOpen = this.modelItem.expanded;
        _setDisplayed(this.eGroupClosedIcon, !folderOpen);
        _setDisplayed(this.eGroupOpenedIcon, folderOpen);
    }

    private refreshAriaExpanded(): void {
        _setAriaExpanded(this.focusWrapper, this.modelItem.expanded);
    }

    public getDisplayName(): string | null {
        return this.displayName;
    }

    public onSelectAllChanged(value: boolean): void {
        const cbSelect = this.cbSelect;
        const cbValue = cbSelect.getValue();
        const readOnly = cbSelect.isReadOnly();

        if (!readOnly && ((value && !cbValue) || (!value && cbValue))) {
            cbSelect.toggle();
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
