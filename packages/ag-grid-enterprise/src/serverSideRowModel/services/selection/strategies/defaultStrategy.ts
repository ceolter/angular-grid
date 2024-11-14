import type {
    BeanCollection,
    IRowModel,
    ISelectionService,
    IServerSideGroupSelectionState,
    IServerSideSelectionState,
    ISetNodesSelectedParams,
    RowNode,
} from 'ag-grid-community';
import { BeanStub, _error, _isMultiRowSelection, _isUsingNewRowSelectionAPI, _warn } from 'ag-grid-community';

import type { ISelectionStrategy } from './iSelectionStrategy';

interface SelectedState {
    selectAll: boolean;
    toggledNodes: Set<string>;
}

export class DefaultStrategy extends BeanStub implements ISelectionStrategy {
    private rowModel: IRowModel;
    private selectionSvc?: ISelectionService;

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.selectionSvc = beans.selectionSvc;
    }

    private selectedState: SelectedState = { selectAll: false, toggledNodes: new Set() };

    private selectAllUsed: boolean = false;
    // this is to prevent regressions, default selectionSvc retains reference of clicked nodes.
    private selectedNodes: { [key: string]: RowNode } = {};

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

    public setNodesSelected(params: ISetNodesSelectedParams): number {
        const { nodes, clearSelection, newValue } = params;
        if (nodes.length === 0) return 0;

        const onlyThisNode = clearSelection && newValue;
        if (!_isMultiRowSelection(this.gos) || onlyThisNode) {
            if (nodes.length > 1) {
                _error(241);
                return 0;
            }
            const rowNode = nodes[0];
            const node = rowNode.footer ? rowNode.sibling : rowNode;
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
            return 1;
        }

        const updateNodeState = (rowNode: RowNode, value = newValue) => {
            const node = rowNode.footer ? rowNode.sibling : rowNode;
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

    public isEmpty(): boolean {
        return !this.selectedState.selectAll && !this.selectedState.toggledNodes?.size;
    }

    public selectAllRowNodes(): void {
        this.selectedState = { selectAll: true, toggledNodes: new Set() };
        this.selectedNodes = {};
        this.selectAllUsed = true;
    }

    public deselectAllRowNodes(): void {
        this.selectedState = { selectAll: false, toggledNodes: new Set() };
        this.selectedNodes = {};
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
