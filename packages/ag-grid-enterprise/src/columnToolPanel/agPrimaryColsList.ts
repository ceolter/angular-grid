import type {
    AbstractColDef,
    AgColumn,
    AgProvidedColumnGroup,
    BeanCollection,
    ColGroupDef,
    ColumnEventType,
    ColumnModel,
    ColumnToolPanelState,
    ComponentSelector,
} from 'ag-grid-community';
import { Component, _exists, _setAriaLabel, _setAriaLevel, _warn, isProvidedColumnGroup } from 'ag-grid-community';

import { syncLayoutWithGrid, toolPanelCreateColumnTree } from '../sideBar/common/toolPanelColDefService';
import type { VirtualListModel } from '../widgets/iVirtualList';
import { VirtualList } from '../widgets/virtualList';
import { ExpandState } from './agPrimaryColsHeader';
import { ColumnModelItem } from './columnModelItem';
import type { ToolPanelColumnCompParams } from './columnToolPanel';
import { selectAllChildren } from './modelItemUtils';
import { PrimaryColsListPanelItemDragFeature } from './primaryColsListPanelItemDragFeature';
import { ToolPanelColumnComp } from './toolPanelColumnComp';
import { ToolPanelColumnGroupComp } from './toolPanelColumnGroupComp';

class UIColumnModel implements VirtualListModel {
    constructor(private readonly items: ColumnModelItem[]) {}

    public getRowCount(): number {
        return this.items.length;
    }

    public getRow(index: number): ColumnModelItem {
        return this.items[index];
    }
}

const PRIMARY_COLS_LIST_PANEL_CLASS = 'ag-column-select-list';

export type AgPrimaryColsListEvent = 'groupExpanded' | 'selectionChanged';
export class AgPrimaryColsList extends Component<AgPrimaryColsListEvent> {
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
    }

    private allowDragging: boolean;
    private filterText: string | null;
    private expandGroupsByDefault: boolean;
    private params: ToolPanelColumnCompParams;
    private eventType: ColumnEventType;

    private groupsExist: boolean;

    private virtualList: VirtualList;

    private allColsTree: ColumnModelItem[];
    private displayedColsList: ColumnModelItem[];
    private destroyColumnItemFuncs: (() => void)[] = [];
    private hasLoadedInitialState: boolean = false;
    private isInitialState: boolean = false;

    constructor() {
        super(/* html */ `<div class="${PRIMARY_COLS_LIST_PANEL_CLASS}" role="presentation"></div>`);
    }

    public override destroy(): void {
        this.destroyColumnTree();
        super.destroy();
    }

    private destroyColumnTree(): void {
        this.allColsTree = [];
        this.destroyColumnItemFuncs.forEach((f) => f());
        this.destroyColumnItemFuncs = [];
    }

    public init(params: ToolPanelColumnCompParams, allowDragging: boolean, eventType: ColumnEventType): void {
        this.params = params;
        this.allowDragging = allowDragging;
        this.eventType = eventType;

        if (!params.suppressSyncLayoutWithGrid) {
            this.addManagedEventListeners({ columnMoved: this.onColumnsChanged.bind(this) });
        }

        this.addManagedEventListeners({
            newColumnsLoaded: this.onColumnsChanged.bind(this),
        });

        const listener = this.fireSelectionChangedEvent.bind(this);
        this.addManagedEventListeners({
            columnPivotChanged: listener,
            columnPivotModeChanged: listener,
            columnRowGroupChanged: listener,
            columnValueChanged: listener,
            columnVisible: listener,
            newColumnsLoaded: listener,
        });

        this.expandGroupsByDefault = !params.contractColumnSelection;

        const virtualList = this.createManagedBean(
            new VirtualList({
                cssIdentifier: 'column-select',
                ariaRole: 'tree',
            })
        );
        this.virtualList = virtualList;

        this.appendChild(virtualList.getGui());

        virtualList.setComponentCreator((item: ColumnModelItem, listItemElement: HTMLElement) => {
            _setAriaLevel(listItemElement, item.depth + 1);
            return this.createComponentFromItem(item, listItemElement);
        });

        if (this.colModel.ready) {
            this.onColumnsChanged();
        }

        if (params.suppressColumnMove) {
            return;
        }

        this.createManagedBean(new PrimaryColsListPanelItemDragFeature(this, virtualList));
    }

    private createComponentFromItem(item: ColumnModelItem, listItemElement: HTMLElement): Component {
        const allowDragging = this.allowDragging;
        if (item.group) {
            const renderedGroup = new ToolPanelColumnGroupComp(item, allowDragging, this.eventType, listItemElement);
            this.createBean(renderedGroup);

            return renderedGroup;
        }

        const columnComp = new ToolPanelColumnComp(item, allowDragging, this.groupsExist, listItemElement);
        this.createBean(columnComp);

        return columnComp;
    }

    public onColumnsChanged(): void {
        const params = this.params;
        if (!this.hasLoadedInitialState) {
            this.hasLoadedInitialState = true;
            this.isInitialState = !!params.initialState;
        }

        const expandedStates = this.getExpandedStates();

        const pivotModeActive = this.colModel.isPivotMode();
        const shouldSyncColumnLayoutWithGrid = !params.suppressSyncLayoutWithGrid && !pivotModeActive;

        if (shouldSyncColumnLayoutWithGrid) {
            this.buildTreeFromWhatGridIsDisplaying();
        } else {
            this.buildTreeFromProvidedColumnDefs();
        }

        this.setExpandedStates(expandedStates);

        this.markFilteredColumns();
        this.flattenAndFilterModel();

        this.isInitialState = false;
    }

    public getDisplayedColsList(): ColumnModelItem[] {
        return this.displayedColsList;
    }

    private getExpandedStates(): { [key: string]: boolean } {
        const res: { [id: string]: boolean } = {};

        if (this.isInitialState) {
            const { expandedGroupIds } = this.params.initialState as ColumnToolPanelState;
            expandedGroupIds.forEach((id) => {
                res[id] = true;
            });
            return res;
        }

        if (!this.allColsTree) {
            return {};
        }

        this.forEachItem((item) => {
            if (!item.group) {
                return;
            }
            const colGroup = item.columnGroup;
            if (colGroup) {
                // group should always exist, this is defensive
                res[colGroup.getId()] = item.expanded;
            }
        });

        return res;
    }

    private setExpandedStates(states: { [key: string]: boolean }): void {
        if (!this.allColsTree) {
            return;
        }

        const { isInitialState } = this;
        this.forEachItem((item) => {
            if (!item.group) {
                return;
            }
            const colGroup = item.columnGroup;
            if (colGroup) {
                // group should always exist, this is defensive
                const expanded = states[colGroup.getId()];
                const groupExistedLastTime = expanded != null;
                if (groupExistedLastTime || isInitialState) {
                    item.expanded = !!expanded;
                }
            }
        });
    }

    private buildTreeFromWhatGridIsDisplaying(): void {
        syncLayoutWithGrid(this.colModel, this.setColumnLayout.bind(this));
    }

    public setColumnLayout(colDefs: AbstractColDef[]): void {
        const columnTree = toolPanelCreateColumnTree(this.colModel, colDefs);
        this.buildListModel(columnTree);

        // using col defs to check if groups exist as it could be a custom layout
        this.groupsExist = colDefs.some((colDef) => {
            return colDef && typeof (colDef as ColGroupDef).children !== 'undefined';
        });

        this.markFilteredColumns();
        this.flattenAndFilterModel();
    }

    private buildTreeFromProvidedColumnDefs(): void {
        const colModel = this.colModel;
        // add column / group comps to tool panel
        this.buildListModel(colModel.getColDefColTree());
        this.groupsExist = !!colModel.colDefCols?.treeDepth;
    }

    private buildListModel(columnTree: (AgColumn | AgProvidedColumnGroup)[]): void {
        const columnExpandedListener = this.onColumnExpanded.bind(this);
        const addListeners = (item: ColumnModelItem) => {
            item.addEventListener('expandedChanged', columnExpandedListener);
            const removeFunc = item.removeEventListener.bind(item, 'expandedChanged', columnExpandedListener);
            this.destroyColumnItemFuncs.push(removeFunc);
        };
        const colNames = this.beans.colNames;

        const recursivelyBuild = (
            tree: (AgColumn | AgProvidedColumnGroup)[],
            dept: number,
            parentList: ColumnModelItem[]
        ): void => {
            tree.forEach((child) => {
                if (isProvidedColumnGroup(child)) {
                    createGroupItem(child, dept, parentList);
                } else {
                    createColumnItem(child, dept, parentList);
                }
            });
        };

        const createGroupItem = (
            columnGroup: AgProvidedColumnGroup,
            dept: number,
            parentList: ColumnModelItem[]
        ): void => {
            const columnGroupDef = columnGroup.getColGroupDef();
            const skipThisGroup = columnGroupDef && columnGroupDef.suppressColumnsToolPanel;
            if (skipThisGroup) {
                return;
            }

            if (columnGroup.isPadding()) {
                recursivelyBuild(columnGroup.getChildren(), dept, parentList);
                return;
            }

            const displayName = colNames.getDisplayNameForProvidedColumnGroup(null, columnGroup, 'columnToolPanel');
            const item: ColumnModelItem = new ColumnModelItem(
                displayName,
                columnGroup,
                dept,
                true,
                this.expandGroupsByDefault
            );

            parentList.push(item);
            addListeners(item);

            recursivelyBuild(columnGroup.getChildren(), dept + 1, item.children);
        };

        const createColumnItem = (column: AgColumn, dept: number, parentList: ColumnModelItem[]): void => {
            const skipThisColumn = column.getColDef() && column.getColDef().suppressColumnsToolPanel;

            if (skipThisColumn) {
                return;
            }

            const displayName = colNames.getDisplayNameForColumn(column, 'columnToolPanel');

            parentList.push(new ColumnModelItem(displayName, column, dept));
        };

        this.destroyColumnTree();
        recursivelyBuild(columnTree, 0, this.allColsTree);
    }

    private onColumnExpanded(): void {
        this.flattenAndFilterModel();
    }

    private flattenAndFilterModel(): void {
        this.displayedColsList = [];

        const recursiveFunc = (item: ColumnModelItem) => {
            if (!item.passesFilter) {
                return;
            }
            this.displayedColsList.push(item);
            if (item.group && item.expanded) {
                item.children.forEach(recursiveFunc);
            }
        };

        const virtualList = this.virtualList;
        this.allColsTree.forEach(recursiveFunc);
        virtualList.setModel(new UIColumnModel(this.displayedColsList));

        const focusedRow = virtualList.getLastFocusedRow();
        virtualList.refresh();

        if (focusedRow != null) {
            this.focusRowIfAlive(focusedRow);
        }

        this.notifyListeners();

        this.refreshAriaLabel();
    }

    private refreshAriaLabel(): void {
        const translate = this.getLocaleTextFunc();
        const columnListName = translate('ariaColumnPanelList', 'Column List');
        const localeColumns = translate('columns', 'Columns');
        const items = this.displayedColsList.length;

        _setAriaLabel(this.virtualList.getAriaElement(), `${columnListName} ${items} ${localeColumns}`);
    }

    private focusRowIfAlive(rowIndex: number): void {
        window.setTimeout(() => {
            if (this.isAlive()) {
                this.virtualList.focusRow(rowIndex);
            }
        }, 0);
    }

    private forEachItem(callback: (item: ColumnModelItem) => void): void {
        const recursiveFunc = (items: ColumnModelItem[]) => {
            items.forEach((item) => {
                callback(item);
                if (item.group) {
                    recursiveFunc(item.children);
                }
            });
        };

        const allColsTree = this.allColsTree;
        if (!allColsTree) {
            return;
        }

        recursiveFunc(allColsTree);
    }

    public doSetExpandedAll(value: boolean): void {
        this.forEachItem((item) => {
            if (item.group) {
                item.expanded = value;
            }
        });
    }

    public setGroupsExpanded(expand: boolean, groupIds?: string[]): void {
        if (!groupIds) {
            this.doSetExpandedAll(expand);
            return;
        }

        const expandedGroupIds: string[] = [];

        this.forEachItem((item) => {
            if (!item.group) {
                return;
            }

            const groupId = item.columnGroup.getId();
            if (groupIds.indexOf(groupId) >= 0) {
                item.expanded = expand;
                expandedGroupIds.push(groupId);
            }
        });

        const unrecognisedGroupIds = groupIds.filter((groupId) => !expandedGroupIds.includes(groupId));
        if (unrecognisedGroupIds.length > 0) {
            _warn(157, { unrecognisedGroupIds });
        }
    }

    private getExpandState(): ExpandState {
        let expandedCount = 0;
        let notExpandedCount = 0;

        this.forEachItem((item) => {
            if (!item.group) {
                return;
            }
            if (item.expanded) {
                expandedCount++;
            } else {
                notExpandedCount++;
            }
        });

        if (expandedCount > 0 && notExpandedCount > 0) {
            return ExpandState.INDETERMINATE;
        }

        if (notExpandedCount > 0) {
            return ExpandState.COLLAPSED;
        }

        return ExpandState.EXPANDED;
    }

    public doSetSelectedAll(selectAllChecked: boolean): void {
        selectAllChildren(this.beans, this.allColsTree, selectAllChecked, this.eventType);
    }

    private getSelectionState(): boolean | undefined {
        let checkedCount = 0;
        let uncheckedCount = 0;

        const pivotMode = this.colModel.isPivotMode();

        this.forEachItem((item) => {
            if (item.group) {
                return;
            }
            if (!item.passesFilter) {
                return;
            }

            const column = item.column;
            const colDef = column.getColDef();

            let checked: boolean;

            if (pivotMode) {
                const noPivotModeOptionsAllowed =
                    !column.isAllowPivot() && !column.isAllowRowGroup() && !column.isAllowValue();
                if (noPivotModeOptionsAllowed) {
                    return;
                }
                checked = column.isValueActive() || column.isPivotActive() || column.isRowGroupActive();
            } else {
                if (colDef.lockVisible) {
                    return;
                }

                checked = column.isVisible();
            }

            checked ? checkedCount++ : uncheckedCount++;
        });

        if (checkedCount > 0 && uncheckedCount > 0) {
            return undefined;
        }

        return !(checkedCount === 0 || uncheckedCount > 0);
    }

    public setFilterText(filterText: string) {
        this.filterText = _exists(filterText) ? filterText.toLowerCase() : null;
        this.markFilteredColumns();
        this.flattenAndFilterModel();
    }

    private markFilteredColumns(): void {
        const passesFilter = (item: ColumnModelItem) => {
            if (!_exists(this.filterText)) {
                return true;
            }

            const displayName = item.displayName;

            return displayName == null || displayName.toLowerCase().indexOf(this.filterText) !== -1;
        };

        const recursivelyCheckFilter = (item: ColumnModelItem, parentPasses: boolean): boolean => {
            let atLeastOneChildPassed = false;
            if (item.group) {
                const groupPasses = passesFilter(item);
                item.children.forEach((child) => {
                    const childPasses = recursivelyCheckFilter(child, groupPasses || parentPasses);
                    if (childPasses) {
                        atLeastOneChildPassed = childPasses;
                    }
                });
            }

            const filterPasses = parentPasses || atLeastOneChildPassed ? true : passesFilter(item);
            item.passesFilter = filterPasses;
            return filterPasses;
        };

        this.allColsTree.forEach((item) => recursivelyCheckFilter(item, false));
    }

    private notifyListeners(): void {
        this.fireGroupExpandedEvent();
        this.fireSelectionChangedEvent();
    }

    private fireGroupExpandedEvent(): void {
        const expandState = this.getExpandState();
        this.dispatchLocalEvent({ type: 'groupExpanded', state: expandState });
    }

    private fireSelectionChangedEvent(): void {
        if (!this.allColsTree) {
            return;
        }
        const selectionState = this.getSelectionState();
        this.dispatchLocalEvent({ type: 'selectionChanged', state: selectionState });
    }

    public getExpandedGroups(): string[] {
        const expandedGroupIds: string[] = [];

        if (!this.allColsTree) {
            return expandedGroupIds;
        }

        this.forEachItem((item) => {
            if (item.group && item.expanded) {
                expandedGroupIds.push(item.columnGroup.getId());
            }
        });

        return expandedGroupIds;
    }
}

export const AgPrimaryColsListSelector: ComponentSelector = {
    selector: 'AG-PRIMARY-COLS-LIST',
    component: AgPrimaryColsList,
};
