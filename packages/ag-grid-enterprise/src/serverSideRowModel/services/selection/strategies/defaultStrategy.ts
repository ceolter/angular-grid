import type {
    BeanCollection,
    IRowModel,
    ISelectionContext,
    ISelectionService,
    IServerSideGroupSelectionState,
    IServerSideSelectionState,
    ISetNodesSelectedParams,
    RowNode,
    SelectionEventSourceType,
} from 'ag-grid-community';
import {
    BeanStub,
    _error,
    _getEnableDeselection,
    _getEnableSelection,
    _getEnableSelectionWithoutKeys,
    _isMultiRowSelection,
    _isUsingNewRowSelectionAPI,
    _last,
    _warn,
} from 'ag-grid-community';

import { ServerSideRowRangeSelectionContext } from '../serverSideRowRangeSelectionContext';
import type { ISelectionStrategy } from './iSelectionStrategy';

interface SelectedState {
    selectAll: boolean;
    toggledNodes: Set<string>;
}

export class DefaultStrategy extends BeanStub implements ISelectionStrategy {
    private rowModel: IRowModel;
    private selectionSvc?: ISelectionService;
    private selectionCtx: ISelectionContext<string>;

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.selectionSvc = beans.selectionSvc;
    }

    private selectedState: SelectedState = { selectAll: false, toggledNodes: new Set() };

    private selectAllUsed: boolean = false;
    // this is to prevent regressions, default selectionSvc retains reference of clicked nodes.
    private selectedNodes: { [key: string]: RowNode } = {};

    public postConstruct(): void {
        this.selectionCtx = new ServerSideRowRangeSelectionContext(this.rowModel);
    }

    public getSelectedState(): IServerSideSelectionState {
        return {
            selectAll: this.selectedState.selectAll,
            toggledNodes: [...this.selectedState.toggledNodes],
        };
    }

    public setSelectedState(state: IServerSideSelectionState | IServerSideGroupSelectionState): void {
        if (typeof state !== 'object') {
            // The provided selection state should be an object
            _error(115);
            return;
        }

        if (!('selectAll' in state)) {
            //'Invalid selection state. The state must conform to `IServerSideSelectionState`.'
            _error(116);
            return;
        }

        if (typeof state.selectAll !== 'boolean') {
            //selectAll must be of boolean type.
            _error(117);
            return;
        }

        if (!('toggledNodes' in state) || !Array.isArray(state.toggledNodes)) {
            return _warn(197);
        }

        const newState: SelectedState = {
            selectAll: state.selectAll,
            toggledNodes: new Set(),
        };

        state.toggledNodes.forEach((key: any) => {
            if (typeof key === 'string') {
                newState.toggledNodes.add(key);
            } else {
                _warn(196, { key });
            }
        });

        const isSelectingMultipleRows = newState.selectAll || newState.toggledNodes.size > 1;
        if (_isUsingNewRowSelectionAPI(this.gos) && !_isMultiRowSelection(this.gos) && isSelectingMultipleRows) {
            _warn(198);
            return;
        }

        this.selectedState = newState;
    }

    public deleteSelectionStateFromParent(parentPath: string[], removedNodeIds: string[]): boolean {
        if (this.selectedState.toggledNodes.size === 0) {
            return false;
        }

        let anyNodesToggled = false;

        removedNodeIds.forEach((id) => {
            if (this.selectedState.toggledNodes.delete(id)) {
                anyNodesToggled = true;
            }
        });

        return anyNodesToggled;
    }

    public handleMouseEvent(event: MouseEvent, rowNode: RowNode, source: SelectionEventSourceType): number {
        const { gos, selectionCtx } = this;
        const currentSelection = rowNode.isSelected();
        const isMeta = event.metaKey || event.ctrlKey;
        const isRowClicked = source === 'rowClicked';
        const isMultiSelect = _isMultiRowSelection(gos);
        const enableClickSelection = _getEnableSelection(gos);
        const enableDeselection = _getEnableDeselection(gos);
        const rowNodeId = rowNode.id!;

        if (isRowClicked && !(enableClickSelection || enableDeselection)) return 0;

        const updateNode = (node: RowNode, val: boolean, shouldClear: boolean) => {
            if (val) {
                if (shouldClear) {
                    this.selectedNodes = {};
                }
                this.selectedNodes[node.id!] = node;
            } else {
                delete this.selectedNodes[node.id!];
            }

            const state = this.selectedState;
            const conformsToSelectAll = val === state.selectAll;
            if (conformsToSelectAll) {
                state.toggledNodes.delete(node.id!);
            } else {
                state.toggledNodes.add(node.id!);
            }
        };

        if (event.shiftKey && isMeta && isMultiSelect) {
            const rootId = selectionCtx.getRoot();
            const root = rootId && this.rowModel.getRowNode(rootId);
            if (root && !root.isSelected()) {
                const partition = selectionCtx.extend(rowNodeId, false);
                partition.keep.forEach((nodeId) => {
                    const node = this.rowModel.getRowNode(nodeId);
                    if (node) {
                        updateNode(node, false, false);
                    }
                });
            } else {
                const partition = selectionCtx.isInRange(rowNodeId)
                    ? selectionCtx.truncate(rowNodeId)
                    : selectionCtx.extend(rowNodeId, false);
                partition.discard.forEach((nodeId) => {
                    const node = this.rowModel.getRowNode(nodeId);
                    if (node) {
                        updateNode(node, false, false);
                    }
                });
                partition.keep.forEach((nodeId) => {
                    const node = this.rowModel.getRowNode(nodeId);
                    if (node) {
                        updateNode(node, true, false);
                    }
                });
            }
            return 1;
        } else if (event.shiftKey && isMultiSelect) {
            const root = selectionCtx.getRoot();
            const selectionRootNode = root ? this.rowModel.getRowNode(root) : null;
            const partition = selectionCtx.isInRange(rowNodeId)
                ? selectionCtx.truncate(rowNodeId)
                : selectionCtx.extend(rowNodeId, false);
            if (selectionRootNode && !selectionRootNode.isSelected()) {
                this.selectedState = { selectAll: false, toggledNodes: new Set() };
                this.selectedNodes = {};
            } else {
                partition.discard.forEach((nodeId) => {
                    const node = this.rowModel.getRowNode(nodeId);
                    if (node) {
                        updateNode(node, false, false);
                    }
                });
            }
            partition.keep.forEach((nodeId) => {
                const node = this.rowModel.getRowNode(nodeId);
                if (node) {
                    updateNode(node, true, false);
                }
            });
            return 1;
        } else if (isMeta) {
            selectionCtx.setRoot(rowNode.id!);

            const shouldClear = !isMultiSelect;
            const newValue = currentSelection ? (isRowClicked ? !enableDeselection : false) : true;

            updateNode(rowNode, newValue, shouldClear);
            return 1;
        } else {
            if (!rowNode.selectable) return 0;
            selectionCtx.setRoot(rowNode.id!);
            const enableSelectionWithoutKeys = _getEnableSelectionWithoutKeys(gos);
            const shouldClear = !isMultiSelect || (isRowClicked && !enableSelectionWithoutKeys);
            const newValue = !currentSelection;

            updateNode(rowNode, newValue, shouldClear);
            return 1;
        }
    }

    public setNodesSelected(params: ISetNodesSelectedParams): number {
        const { nodes, clearSelection, newValue } = params;
        if (nodes.length === 0) return 0;

        const onlyThisNode = clearSelection && newValue;
        if (!_isMultiRowSelection(this.gos) || onlyThisNode) {
            if (nodes.length > 1) {
                throw new Error("AG Grid: cannot select multiple rows when rowSelection.mode is set to 'singleRow'");
            }
            const node = nodes[0];
            if (newValue && node.selectable) {
                this.selectedNodes = { [node.id!]: node };
                this.selectedState = {
                    selectAll: false,
                    toggledNodes: new Set([node.id!]),
                };
            } else {
                this.selectedNodes = {};
                this.selectedState = {
                    selectAll: false,
                    toggledNodes: new Set(),
                };
            }
            if (node.selectable) {
                this.selectionCtx.setRoot(node.id!);
            }
            return 1;
        }

        const updateNodeState = (node: RowNode, value = newValue) => {
            if (value && node.selectable) {
                this.selectedNodes[node.id!] = node;
            } else {
                delete this.selectedNodes[node.id!];
            }

            const doesNodeConform = value === this.selectedState.selectAll;
            if (doesNodeConform || !node.selectable) {
                this.selectedState.toggledNodes.delete(node.id!);
            } else {
                this.selectedState.toggledNodes.add(node.id!);
            }
        };

        nodes.forEach((node) => updateNodeState(node));
        this.selectionCtx.setRoot(_last(nodes).id!);
        return 1;
    }

    public processNewRow(node: RowNode<any>): void {
        if (this.selectedNodes[node.id!]) {
            this.selectedNodes[node.id!] = node;
        }
    }

    public isNodeSelected(node: RowNode): boolean | undefined {
        const isToggled = this.selectedState.toggledNodes.has(node.id!);
        return this.selectedState.selectAll ? !isToggled : isToggled;
    }

    public getSelectedNodes(): RowNode<any>[] {
        if (this.selectAllUsed) {
            _warn(199);
        }
        return Object.values(this.selectedNodes);
    }

    public getSelectedRows(): any[] {
        return this.getSelectedNodes().map((node) => node.data);
    }

    public getSelectionCount(): number {
        if (this.selectedState.selectAll) {
            return -1;
        }
        return this.selectedState.toggledNodes.size;
    }

    public clearOtherNodes(rowNodeToKeepSelected: RowNode<any>, source: SelectionEventSourceType): number {
        const clearedRows = this.selectedState.selectAll ? 1 : this.selectedState.toggledNodes.size - 1;
        this.selectedState = {
            selectAll: false,
            toggledNodes: new Set([rowNodeToKeepSelected.id!]),
        };

        this.rowModel.forEachNode((node) => {
            if (node !== rowNodeToKeepSelected) {
                this.selectionSvc?.selectRowNode(node, false, undefined, source);
            }
        });

        this.eventSvc.dispatchEvent({
            type: 'selectionChanged',
            source,
        });

        return clearedRows;
    }

    public isEmpty(): boolean {
        return !this.selectedState.selectAll && !this.selectedState.toggledNodes?.size;
    }

    public selectAllRowNodes(): void {
        this.selectedState = { selectAll: true, toggledNodes: new Set() };
        this.selectedNodes = {};
        this.selectAllUsed = true;
        this.selectionCtx.reset();
    }

    public deselectAllRowNodes(): void {
        this.selectedState = { selectAll: false, toggledNodes: new Set() };
        this.selectedNodes = {};
        this.selectionCtx.reset();
    }

    public getSelectAllState(): boolean | null {
        if (this.selectedState.selectAll) {
            if (this.selectedState.toggledNodes.size > 0) {
                return null;
            }
            return true;
        }

        if (this.selectedState.toggledNodes.size > 0) {
            return null;
        }
        return false;
    }
}
