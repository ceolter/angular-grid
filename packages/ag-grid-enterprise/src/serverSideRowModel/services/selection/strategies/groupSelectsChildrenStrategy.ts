import type {
    BeanCollection,
    FilterManager,
    FuncColsService,
    IRowModel,
    IRowNode,
    ISelectionService,
    IServerSideGroupSelectionState,
    IServerSideSelectionState,
    ISetNodesSelectedParams,
    RowNode,
    SelectionEventSourceType,
} from 'ag-grid-community';
import { BeanStub, _error, _isMultiRowSelection, _last, _warn, isSelectionUIEvent } from 'ag-grid-community';

import type { LazyStore } from '../../../stores/lazy/lazyStore';
import { ServerSideRowRangeSelectionContext } from '../serverSideRowRangeSelectionContext';
import type { ISelectionStrategy } from './iSelectionStrategy';

interface SelectionState {
    selectAllChildren: boolean;
    toggledNodes: Map<string, SelectionState>;
}

export class GroupSelectsChildrenStrategy extends BeanStub implements ISelectionStrategy {
    private rowModel: IRowModel;
    private funcColsSvc: FuncColsService;
    private filterManager?: FilterManager;
    private selectionSvc: ISelectionService;
    private selectionCtx = new ServerSideRowRangeSelectionContext();

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.funcColsSvc = beans.funcColsSvc;
        this.filterManager = beans.filterManager;
        this.selectionSvc = beans.selectionSvc!;
    }

    private selectedState: SelectionState = { selectAllChildren: false, toggledNodes: new Map() };

    public postConstruct(): void {
        this.addManagedEventListeners({
            // if model has updated, a store may now be fully loaded to clean up indeterminate states
            modelUpdated: () => this.removeRedundantState(),
            // when the grouping changes, the state no longer makes sense, so reset the state.
            columnRowGroupChanged: () => this.selectionSvc.reset('rowGroupChanged'),
        });

        this.selectionCtx.init(this.rowModel);
    }

    public getSelectedState() {
        const treeData = this.gos.get('treeData');
        const recursivelySerializeState = (state: SelectionState, level: number, nodeId?: string) => {
            const normalisedState: IServerSideGroupSelectionState = {
                nodeId,
            };

            if (treeData || level <= this.funcColsSvc.rowGroupCols.length) {
                normalisedState.selectAllChildren = state.selectAllChildren;
            }

            // omit toggledNodes if empty
            if (state.toggledNodes.size) {
                const toggledNodes: IServerSideGroupSelectionState[] = [];
                state.toggledNodes.forEach((value, key) => {
                    const newState = recursivelySerializeState(value, level + 1, key);
                    toggledNodes.push(newState);
                });
                normalisedState.toggledNodes = toggledNodes;
            }

            return normalisedState;
        };
        return recursivelySerializeState(this.selectedState, 0);
    }

    public setSelectedState(state: IServerSideSelectionState | IServerSideGroupSelectionState): void {
        if ('selectAll' in state) {
            // 'Invalid selection state. When `groupSelectsChildren` is enabled, the state must conform to `IServerSideGroupSelectionState`.'
            _error(111);
            return;
        }

        const recursivelyDeserializeState = (
            normalisedState: IServerSideGroupSelectionState,
            parentSelected: boolean
        ): SelectionState => {
            if (typeof normalisedState !== 'object') {
                throw new Error('Each provided state object must be an object.');
            }
            if ('selectAllChildren' in normalisedState && typeof normalisedState.selectAllChildren !== 'boolean') {
                throw new Error('`selectAllChildren` must be a boolean value or undefined.');
            }
            if ('toggledNodes' in normalisedState) {
                if (!Array.isArray(normalisedState.toggledNodes)) {
                    throw new Error('`toggledNodes` must be an array.');
                }
                const allHaveIds = normalisedState.toggledNodes.every(
                    (innerState) =>
                        typeof innerState === 'object' &&
                        'nodeId' in innerState &&
                        typeof innerState.nodeId === 'string'
                );
                if (!allHaveIds) {
                    throw new Error('Every `toggledNode` requires an associated string id.');
                }
            }
            const isThisNodeSelected = normalisedState.selectAllChildren ?? !parentSelected;
            const convertedChildren = normalisedState.toggledNodes?.map<[string, SelectionState]>((innerState) => [
                innerState.nodeId!,
                recursivelyDeserializeState(innerState, isThisNodeSelected),
            ]);
            const doesRedundantStateExist = convertedChildren?.some(
                ([, innerState]) =>
                    isThisNodeSelected === innerState.selectAllChildren && innerState.toggledNodes.size === 0
            );
            if (doesRedundantStateExist) {
                throw new Error(`
                    Row selection state could not be parsed due to invalid data. Ensure all child state has toggledNodes or does not conform with the parent rule.
                    Please rebuild the selection state and reapply it.
                `);
            }
            return {
                selectAllChildren: isThisNodeSelected,
                toggledNodes: new Map(convertedChildren),
            };
        };

        try {
            this.selectedState = recursivelyDeserializeState(state, !!state.selectAllChildren);
        } catch (e) {
            _error(238, { message: e.message });
        }
    }

    public deleteSelectionStateFromParent(parentRoute: string[], removedNodeIds: string[]): boolean {
        let parentState: SelectionState | undefined = this.selectedState;
        const remainingRoute = [...parentRoute];
        while (parentState && remainingRoute.length) {
            parentState = parentState.toggledNodes.get(remainingRoute.pop()!);
        }

        // parent has no explicit state, nothing to remove
        if (!parentState) {
            return false;
        }

        let anyStateChanged = false;
        removedNodeIds.forEach((id) => {
            if (parentState?.toggledNodes.delete(id)) {
                anyStateChanged = true;
            }
        });

        if (anyStateChanged) {
            this.removeRedundantState();
        }
        return anyStateChanged;
    }

    private overrideSelectionValue(newValue: boolean, source: SelectionEventSourceType): boolean {
        if (!isSelectionUIEvent(source)) {
            return newValue;
        }

        const root = this.selectionCtx.getRoot();
        const node = root ? this.rowModel.getRowNode(root) : null;

        return node ? node.isSelected() ?? false : true;
    }

    public setNodesSelected({ nodes, newValue, rangeSelect, clearSelection, source }: ISetNodesSelectedParams): number {
        if (nodes.length === 0) return 0;

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
                    this.selectRange(partition.discard, false);
                }
                this.selectRange(partition.keep, newSelectionValue);
                return 1;
            } else {
                const fromNode = this.selectionCtx.getRoot();
                const toNode = node;
                if (fromNode !== toNode.id) {
                    const partition = this.selectionCtx.extend(node.id!, true);
                    if (newSelectionValue) {
                        this.selectRange(partition.discard, false);
                    }
                    this.selectRange(partition.keep, newSelectionValue);
                    return 1;
                }
            }
            return 1;
        }

        const onlyThisNode = clearSelection && newValue && !rangeSelect;
        if (!_isMultiRowSelection(this.gos) || onlyThisNode) {
            if (nodes.length > 1) {
                throw new Error("AG Grid: cannot select multiple rows when rowSelection.mode is set to 'singleRow'");
            }
            this.deselectAllRowNodes();
        }

        nodes.forEach((node) => {
            const idPathToNode = this.getRouteToNode(node);
            this.recursivelySelectNode(idPathToNode, this.selectedState, newValue);
        });
        this.removeRedundantState();
        this.selectionCtx.setRoot(_last(nodes).id!);
        return 1;
    }

    private selectRange(nodes: RowNode[], newValue: boolean) {
        // sort routes longest to shortest, meaning we can do the lowest level children first
        const routes = nodes.map(this.getRouteToNode).sort((a, b) => b.length - a.length);

        // keep track of nodes we've seen so we can skip branches we've visited already
        const seen = new Set<RowNode>();
        routes.forEach((route) => {
            if (seen.has(_last(route))) {
                return;
            }
            route.forEach((part) => seen.add(part));

            this.recursivelySelectNode(route, this.selectedState, newValue);
        });

        this.removeRedundantState();
    }

    public isNodeSelected(node: RowNode): boolean | undefined {
        const path = this.getRouteToNode(node);
        return this.isNodePathSelected(path, this.selectedState);
    }

    private isNodePathSelected([nextNode, ...nodes]: RowNode[], state: SelectionState): boolean | undefined {
        if (nodes.length === 0) {
            const isToggled = state.toggledNodes.has(nextNode.id!);
            if (nextNode.hasChildren()) {
                const groupState = state.toggledNodes.get(nextNode.id!);
                if (groupState && groupState.toggledNodes.size) {
                    return undefined;
                }
            }
            return state.selectAllChildren ? !isToggled : isToggled;
        }

        // if there's a deeper level, check recursively
        if (state.toggledNodes.has(nextNode.id!)) {
            const nextState = state.toggledNodes.get(nextNode.id!);
            if (nextState) {
                return this.isNodePathSelected(nodes, nextState);
            }
        }

        // no deeper custom state, respect the closest default
        return state.selectAllChildren;
    }

    private getRouteToNode(node: RowNode) {
        const pathToNode = [];
        let tempNode = node;
        while (tempNode.parent) {
            pathToNode.push(tempNode);
            tempNode = tempNode.parent;
        }
        return pathToNode.reverse();
    }

    private removeRedundantState() {
        if (this.filterManager?.isAnyFilterPresent()) {
            return;
        }

        const forEachNodeStateDepthFirst = (
            state = this.selectedState,
            thisKey?: string,
            parentState?: SelectionState
        ) => {
            // clean up lowest level state first in order to calculate this levels state
            // from updated child state
            state.toggledNodes.forEach((value, key) => {
                forEachNodeStateDepthFirst(value, key, state);
            });

            if (thisKey) {
                const thisRow = this.rowModel.getRowNode(thisKey);
                const thisRowStore = thisRow?.childStore as LazyStore | undefined;
                const isStoreSizeKnown = thisRowStore?.isLastRowIndexKnown();
                if (isStoreSizeKnown) {
                    // have to check greater than, as we may have stale state still, if so all visible rows may not be
                    // toggled
                    const possibleAllNodesToggled = state.toggledNodes.size >= thisRowStore!.getRowCount();
                    if (possibleAllNodesToggled) {
                        // more complex checks nested for performance
                        for (const childState of state.toggledNodes.entries()) {
                            const [key, value] = childState;
                            // if any child has toggled rows, then this row is indeterminate
                            // and the state is relevant.
                            if (value.toggledNodes.size > 0) {
                                return;
                            }

                            const rowDoesNotExist = !this.rowModel.getRowNode(key);
                            if (rowDoesNotExist) {
                                // if row doesn't exist, it's not toggled.
                                return;
                            }
                        }

                        // no indeterminate rows, and all rows are toggled, flip this row state
                        // and clear child states.
                        state.selectAllChildren = !state.selectAllChildren;
                        state.toggledNodes.clear();
                    }
                }
            }

            // if this has no toggled rows, and is identical to parent state, it's redundant and can be removed.
            const hasNoToggledRows = state.toggledNodes.size === 0;
            const isIdenticalToParent = parentState?.selectAllChildren === state.selectAllChildren;
            if (hasNoToggledRows && isIdenticalToParent) {
                parentState?.toggledNodes.delete(thisKey!);
            }
        };
        forEachNodeStateDepthFirst();
    }

    private recursivelySelectNode([nextNode, ...nodes]: IRowNode[], selectedState: SelectionState, newValue: boolean) {
        if (!nextNode) {
            return;
        }

        // if this is the last node, hard add/remove based on its selectAllChildren state
        const isLastNode = !nodes.length;
        if (isLastNode) {
            // if the node is not selectable, we should never have it in selection state
            const isNodeSelectable = nextNode.selectable;
            const doesNodeConform = selectedState.selectAllChildren === newValue;
            if (doesNodeConform || !isNodeSelectable) {
                selectedState.toggledNodes.delete(nextNode.id!);
                return;
            }
            const newState: SelectionState = {
                selectAllChildren: newValue,
                toggledNodes: new Map(),
            };
            selectedState.toggledNodes.set(nextNode.id!, newState);
            return;
        }

        const doesStateAlreadyExist = selectedState.toggledNodes.has(nextNode.id!);
        const childState: SelectionState = selectedState.toggledNodes.get(nextNode.id!) ?? {
            selectAllChildren: selectedState.selectAllChildren,
            toggledNodes: new Map(),
        };

        if (!doesStateAlreadyExist) {
            selectedState.toggledNodes.set(nextNode.id!, childState);
        }

        this.recursivelySelectNode(nodes, childState, newValue);

        // cleans out groups which have no toggled nodes and an equivalent default to its parent
        if (selectedState.selectAllChildren === childState.selectAllChildren && childState.toggledNodes.size === 0) {
            selectedState.toggledNodes.delete(nextNode.id!);
        }
    }

    public getSelectedNodes(): RowNode<any>[] {
        _warn(202);

        const selectedNodes: RowNode[] = [];
        this.rowModel.forEachNode((node) => {
            if (node.isSelected()) {
                selectedNodes.push(node);
            }
        });
        return selectedNodes;
    }

    public processNewRow(): void {
        // This is used for updating outdated node refs, as this model entirely uses ids it's irrelevant
    }

    public getSelectedRows(): any[] {
        return this.getSelectedNodes().map((node) => node.data);
    }

    public getSelectionCount(): number {
        return -1;
    }

    public isEmpty(): boolean {
        return !this.selectedState.selectAllChildren && !this.selectedState.toggledNodes?.size;
    }

    public selectAllRowNodes(): void {
        this.selectedState = { selectAllChildren: true, toggledNodes: new Map() };
        this.selectionCtx.reset();
    }

    public deselectAllRowNodes(): void {
        this.selectedState = { selectAllChildren: false, toggledNodes: new Map() };
        this.selectionCtx.reset();
    }

    public getSelectAllState(): boolean | null {
        if (this.selectedState.selectAllChildren) {
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
