import type { AgCheckbox, AgColumn, DragItem, DragSource, ITooltipCtrl, TooltipFeature } from 'ag-grid-community';
import {
    AgCheckboxSelector,
    Component,
    DragSourceType,
    KeyCode,
    RefPlaceholder,
    _createIconNoSpan,
    _escapeString,
    _getShouldDisplayTooltip,
    _getToolPanelClassesFromColDef,
    _setAriaDescribedBy,
    _setAriaLabel,
    _setDisplayed,
    _warn,
} from 'ag-grid-community';

import type { ColumnModelItem } from './columnModelItem';
import { createPivotState, setAllColumns, updateColumns } from './modelItemUtils';
import { ToolPanelContextMenu } from './toolPanelContextMenu';

export class ToolPanelColumnComp extends Component {
    private readonly eLabel: HTMLElement = RefPlaceholder;
    private readonly cbSelect: AgCheckbox = RefPlaceholder;

    public readonly column: AgColumn;
    private readonly columnDept: number;
    private eDragHandle: Element;
    private readonly displayName: string | null;
    private processingColumnStateChange = false;
    private tooltipFeature?: TooltipFeature;

    constructor(
        modelItem: ColumnModelItem,
        private readonly allowDragging: boolean,
        private readonly groupsExist: boolean,
        private readonly focusWrapper: HTMLElement
    ) {
        super();
        const { column, depth, displayName } = modelItem;
        this.column = column;
        this.columnDept = depth;
        this.displayName = displayName;
    }

    public postConstruct(): void {
        this.setTemplate(
            /* html */
            `<div class="ag-column-select-column">
                <ag-checkbox data-ref="cbSelect" class="ag-column-select-checkbox"></ag-checkbox>
                <span class="ag-column-select-column-label" data-ref="eLabel"></span>
            </div>`,
            [AgCheckboxSelector]
        );
        const {
            beans,
            cbSelect,
            displayName,
            eLabel,
            columnDept: indent,
            groupsExist,
            column,
            gos,
            focusWrapper,
        } = this;
        const eDragHandle = _createIconNoSpan('columnDrag', beans)!;
        this.eDragHandle = eDragHandle;
        eDragHandle.classList.add('ag-drag-handle', 'ag-column-select-column-drag-handle');

        const checkboxGui = cbSelect.getGui();
        const checkboxInput = cbSelect.getInputElement();

        checkboxGui.insertAdjacentElement('afterend', eDragHandle);
        checkboxInput.setAttribute('tabindex', '-1');

        const displayNameSanitised: any = _escapeString(displayName);
        eLabel.innerHTML = displayNameSanitised;

        // if grouping, we add an extra level of indent, to cater for expand/contract icons we need to indent for
        if (groupsExist) {
            this.addCssClass('ag-column-select-add-group-indent');
        }
        this.addCssClass(`ag-column-select-indent-${indent}`);
        this.getGui().style.setProperty('--ag-indentation-level', String(indent));

        this.tooltipFeature = this.createOptionalManagedBean(
            beans.registry.createDynamicBean<TooltipFeature>('tooltipFeature', false, {
                getGui: () => this.getGui(),
                getLocation: () => 'columnToolPanelColumn',
                getColDef: () => column.getColDef(),
                shouldDisplayTooltip: _getShouldDisplayTooltip(gos, () => eLabel),
            } as ITooltipCtrl)
        );

        this.setupDragging();

        const onColStateChanged = this.onColumnStateChanged.bind(this);
        this.addManagedEventListeners({ columnPivotModeChanged: onColStateChanged });

        this.addManagedListeners(column, {
            columnValueChanged: onColStateChanged,
            columnPivotChanged: onColStateChanged,
            columnRowGroupChanged: onColStateChanged,
            visibleChanged: onColStateChanged,
        });
        this.addManagedListeners(focusWrapper, {
            keydown: this.handleKeyDown.bind(this),
            contextmenu: this.onContextMenu.bind(this),
        });

        this.addManagedPropertyListener('functionsReadOnly', this.onColumnStateChanged.bind(this));

        this.addManagedListeners(cbSelect, { fieldValueChanged: this.onCheckboxChanged.bind(this) });
        this.addManagedElementListeners(eLabel, { click: this.onLabelClicked.bind(this) });

        this.onColumnStateChanged();
        this.refreshAriaLabel();

        this.setupTooltip();

        const classes = _getToolPanelClassesFromColDef(column.getColDef(), gos, column, null);
        classes.forEach((c) => this.addOrRemoveCssClass(c, true));
    }

    public getColumn(): AgColumn {
        return this.column;
    }

    private setupTooltip(): void {
        const refresh = () => this.tooltipFeature?.setTooltipAndRefresh(this.column.getColDef().headerTooltip);
        refresh();

        this.addManagedEventListeners({ newColumnsLoaded: refresh });
    }

    private onContextMenu(e: MouseEvent): void {
        const { column, gos } = this;

        if (gos.get('functionsReadOnly')) {
            return;
        }

        const contextMenu = this.createBean(new ToolPanelContextMenu(column, e, this.focusWrapper));
        this.addDestroyFunc(() => {
            if (contextMenu.isAlive()) {
                this.destroyBean(contextMenu);
            }
        });
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        if (e.key === KeyCode.SPACE) {
            e.preventDefault();
            if (this.isSelectable()) {
                this.onSelectAllChanged(!this.isSelected());
            }
        }
    }

    private onLabelClicked(): void {
        if (this.gos.get('functionsReadOnly')) {
            return;
        }

        const nextState = !this.cbSelect.getValue();
        this.onChangeCommon(nextState);
    }

    private onCheckboxChanged(event: any): void {
        this.onChangeCommon(event.selected);
    }

    private onChangeCommon(nextState: boolean): void {
        // ignore lock visible columns
        if (this.cbSelect.isReadOnly()) {
            return;
        }

        this.refreshAriaLabel();

        // only want to action if the user clicked the checkbox, not if we are setting the checkbox because
        // of a change in the model
        if (this.processingColumnStateChange) {
            return;
        }

        setAllColumns(this.beans, [this.column], nextState, 'toolPanelUi');
    }

    private refreshAriaLabel(): void {
        const { cbSelect, focusWrapper, displayName } = this;
        const translate = this.getLocaleTextFunc();
        const columnLabel = translate('ariaColumn', 'Column');
        const state = cbSelect.getValue() ? translate('ariaVisible', 'visible') : translate('ariaHidden', 'hidden');
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');

        _setAriaLabel(focusWrapper, `${displayName} ${columnLabel}`);
        this.cbSelect.setInputAriaLabel(`${visibilityLabel} (${state})`);
        _setAriaDescribedBy(focusWrapper, cbSelect.getInputElement().id);
    }

    private setupDragging(): void {
        const eDragHandle = this.eDragHandle;
        if (!this.allowDragging) {
            _setDisplayed(eDragHandle, false);
            return;
        }

        const beans = this.beans;
        const { gos, eventSvc, dragAndDrop } = beans;

        let hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
        const dragSource: DragSource = {
            type: DragSourceType.ToolPanel,
            eElement: eDragHandle,
            dragItemName: this.displayName,
            getDefaultIconName: () => (hideColumnOnExit ? 'hide' : 'notAllowed'),
            getDragItem: () => this.createDragItem(),
            onDragStarted: () => {
                hideColumnOnExit = !gos.get('suppressDragLeaveHidesColumns');
                eventSvc.dispatchEvent({
                    type: 'columnPanelItemDragStart',
                    column: this.column,
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
                        columns: [this.column],
                        visibleState: dragItem?.visibleState,
                        pivotState: dragItem?.pivotState,
                        eventType: 'toolPanelUi',
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
        const colId = this.column.getColId();
        const visibleState = { [colId]: this.column.isVisible() };
        const pivotState = { [colId]: createPivotState(this.column) };
        return {
            columns: [this.column],
            visibleState,
            pivotState,
        };
    }

    private onColumnStateChanged(): void {
        this.processingColumnStateChange = true;
        const isPivotMode = this.beans.colModel.isPivotMode();
        if (isPivotMode) {
            // if reducing, checkbox means column is one of pivot, value or group
            const anyFunctionActive = this.column.isAnyFunctionActive();
            this.cbSelect.setValue(anyFunctionActive);
        } else {
            // if not reducing, the checkbox tells us if column is visible or not
            this.cbSelect.setValue(this.column.isVisible());
        }

        let canBeToggled = true;
        let canBeDragged = true;
        if (isPivotMode) {
            // when in pivot mode, the item should be read only if:
            //  a) gui is not allowed make any changes
            const functionsReadOnly = this.gos.get('functionsReadOnly');
            //  b) column is not allow any functions on it
            const noFunctionsAllowed = !this.column.isAnyFunctionAllowed();
            canBeToggled = !functionsReadOnly && !noFunctionsAllowed;
            canBeDragged = canBeToggled;
        } else {
            const { enableRowGroup, enableValue, lockPosition, suppressMovable, lockVisible } = this.column.getColDef();
            const forceDraggable = !!enableRowGroup || !!enableValue;
            const disableDraggable = !!lockPosition || !!suppressMovable;
            canBeToggled = !lockVisible;
            canBeDragged = forceDraggable || !disableDraggable;
        }

        this.cbSelect.setReadOnly(!canBeToggled);
        this.eDragHandle.classList.toggle('ag-column-select-column-readonly', !canBeDragged);
        this.addOrRemoveCssClass('ag-column-select-column-readonly', !canBeDragged && !canBeToggled);

        this.cbSelect.setPassive(false);

        this.processingColumnStateChange = false;
    }

    public getDisplayName(): string | null {
        return this.displayName;
    }

    public onSelectAllChanged(value: boolean): void {
        const cbSelect = this.cbSelect;
        if (value !== cbSelect.getValue()) {
            if (!cbSelect.isReadOnly()) {
                cbSelect.toggle();
            }
        }
    }

    public isSelected(): boolean | undefined {
        return this.cbSelect.getValue();
    }

    public isSelectable(): boolean {
        return !this.cbSelect.isReadOnly();
    }

    public isExpandable(): boolean {
        return false;
    }

    public setExpanded(_value: boolean): void {
        _warn(158);
    }
}
