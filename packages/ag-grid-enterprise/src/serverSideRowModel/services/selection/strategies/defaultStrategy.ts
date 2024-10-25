import type {
    BeanCollection,
    IRowModel,
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
    _isMultiRowSelection,
    _isUsingNewRowSelectionAPI,
    _last,
    _warn,
    isSelectionUIEvent,
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
    private selectionCtx = new ServerSideRowRangeSelectionContext();

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.selectionSvc = beans.selectionSvc;
    }

    private selectedState: SelectedState = { selectAll: false, toggledNodes: new Set() };

    private selectAllUsed: boolean = false;
    // this is to prevent regressions, default selectionSvc retains reference of clicked nodes.
    private selectedNodes: { [key: string]: RowNode } = {};

    public postConstruct(): void {
        this.selectionCtx.init(this.rowModel);
    }

    public getSelectedState(): IServerSideSelectionState {
        return {
            selectAll: this.selectedState.selectAll,
            toggledNodes: [...this.selectedState.toggledNodes],
        };
    }

    public setSelectedState(state: IServerSideSelectionState | IServerSideGroupSelectionState): void {
        // fire selection changed event
        const newState: SelectedState = {
            selectAll: false,
            toggledNodes: new Set(),
        };

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

        if (typeof state.selectAll === 'boolean') {
            newState.selectAll = state.selectAll;
        } else {
            //selectAll must be of boolean type.
            _error(117);
            return;
        }

        if ('toggledNodes' in state && Array.isArray(state.toggledNodes)) {
            state.toggledNodes.forEach((key: any) => {
                if (typeof key === 'string') {
                    newState.toggledNodes.add(key);
                } else {
                    _warn(196, { key });
                }
            });
        } else {
            _warn(197);
            return;
        }

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

    private overrideSelectionValue(newValue: boolean, source: SelectionEventSourceType): boolean {
        if (!isSelectionUIEvent(source)) {
            return newValue;
        }

        const root = this.selectionCtx.getRoot();
        const node = root ? this.rowModel.getRowNode(root) : null;

        return node ? node.isSelected() ?? false : true;
    }

    public setNodesSelected(params: ISetNodesSelectedParams): number {
        const { nodes, clearSelection, newValue, rangeSelect, source } = params;
        if (nodes.length === 0) return 0;

        const onlyThisNode = clearSelection && newValue && !rangeSelect;
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

        if (rangeSelect) {
            if (nodes.length > 1) {
                throw new Error('AG Grid: cannot select multiple rows when using rangeSelect');
            }
            const node = nodes[0];
            const newSelectionValue = this.overrideSelectionValue(newValue, source);

            if (this.selectionCtx.isInRange(node.id!)) {
                const partition = this.selectionCtx.truncate(node.id!);

                // When we are selecting a range, we may need to de-select part of the previously
                // selected range (see AG-9620)
                // When we are de-selecting a range, we can/should leave the other nodes unchanged
                // (i.e. selected nodes outside the current range should remain selected - see AG-10215)
                if (newSelectionValue) {
                    partition.discard.forEach((node) => updateNodeState(node, false));
                }
                partition.keep.forEach((node) => updateNodeState(node, newSelectionValue));
            } else {
                const fromNode = this.selectionCtx.getRoot();
                const toNode = node;
                if (fromNode !== toNode.id) {
                    const partition = this.selectionCtx.extend(node.id!);
                    if (newSelectionValue) {
                        partition.discard.forEach((node) => updateNodeState(node, false));
                    }
                    partition.keep.forEach((node) => updateNodeState(node, newSelectionValue));
                }
            }
            return 1;
        }

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
