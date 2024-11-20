import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { GridOptionsService } from '../gridOptionsService';
import type { ClientSideRowModelStage } from '../interfaces/iClientSideRowModel';
import type { IRowNode } from '../interfaces/iRowNode';
import type { IRowNodeStageDefinition } from '../interfaces/iRowNodeStage';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { ChangedPath } from '../utils/changedPath';
import type { AbstractClientSideNodeManager } from './abstractClientSideNodeManager';

const orderedStepMap: Record<ClientSideRowModelStage, number> = {
    group: 1,
    filter: 2,
    pivot: 3,
    aggregate: 4,
    filter_aggregates: 5,
    sort: 6,
    map: 7,
    nothing: 8,
};

const orderedSteps: Record<ClientSideRowModelStage, number> = Object.assign(Object.create(null), orderedStepMap);

export type AsyncTransactionsCallback<TData = any> = (transaction: RowNodeTransaction<TData>) => void;

export interface RefreshModelParams<TData = any> {
    /** how much of the pipeline to execute */
    step: ClientSideRowModelStage;

    /** true if this update is due to columns changing, ie no rows were changed */
    columnsChanged?: boolean;

    /** if true, rows that are kept are animated to the new position */
    animate?: boolean;

    /**
     * if NOT new data, then this flag tells grid to check if rows already
     * exist for the nodes (matching by node id) and reuses the row if it does.
     */
    keepRenderedRows?: boolean;

    /** true if all we did is changed row height, data still the same, no need to clear the undo/redo stacks */
    keepUndoRedoStack?: boolean;

    /** The set of changed grid options, if any */
    changedProps?: (keyof GridOptions<TData>)[];

    /** True if the row order changed */
    rowsOrderChanged?: boolean;

    /** A callback to execute to update row nodes, or execute transactions */
    updateRowNodes?: (state: RefreshModelState<TData>) => void;

    afterRefresh?: () => void;
}

const createInactiveChangedPath = (rootNode: RowNode) => {
    const changedPath = new ChangedPath(false, rootNode);
    changedPath.active = false;
    return changedPath;
};

export class RefreshModelState<TData = any> {
    public rowData: TData[] | null | undefined;

    /**
     * This flag indicates that a full refresh of the row data is required.
     * - true if the node manager changed
     * - true if a client side node manager needs a full reload of the data due to a property change,
     *   with extract row data from row nodes if needed
     */
    public fullReload: boolean = false;

    /** The CSRM might still not be in a started state during initialization */
    public started: boolean = false;

    /** how much of the pipeline to execute */
    public step: ClientSideRowModelStage;

    /** true if columns were changed, this is used by tree data and grouping to check if group data need to be changed */
    public columnsChanged: boolean;

    /** if true, rows that are kept are animated to the new position */
    public animate: boolean;

    /**
     * if NOT new data, then this flag tells grid to check if rows already
     * exist for the nodes (matching by node id) and reuses the row if it does.
     */
    public keepRenderedRows: boolean;

    /** true if all we did is changed row height, data still the same, no need to clear the undo/redo stacks */
    public keepUndoRedoStack: boolean;

    /**
     * The set of removed nodes.
     * Mutually exclusive, if a node is here, it cannot be in the updates map.
     */
    public readonly removals = new Set<RowNode<TData>>();

    /**
     * Map of row nodes that have been updated.
     * The value is true if the row node is a new node. is false if it was just updated.
     */
    public readonly updates = new Map<RowNode<TData>, boolean>();

    /**
     * The list of transactions that are being executed.
     * Is null if no transactions are being executed, that can happen for newData or for immutable updates.
     */
    public deltaUpdateTransactions: RowNodeTransaction<TData>[] | null = null;

    /** true if rows were inserted in the middle of something else and not just appended or removed. */
    public rowsInserted = false;

    /** true if the order of root.allLeafChildren has changed. */
    public rowsOrderChanged: boolean;

    /** True if new data or delta update */
    public rowDataUpdated: boolean = false;

    /**
     * Indicates a completely new rowData array is loaded.
     * If this is true, we consider this a new reload of data from scratch, or a first load of data.
     * In this case, removals will not contain the previous cleared rows.
     * Is true if user called setRowData() (or a new page in pagination). the grid scrolls back to the top when this is true.
     */
    public newData: boolean = false;

    /** True if the changes were initiated by a delta update (immutable row data) or new data (reload of row data) */
    public deltaUpdate: boolean = false;

    public constructor(
        /** The Grid Option Service instance to query grid options */
        public readonly gos: GridOptionsService,

        /** The CSRM rootNode */
        public readonly rootNode: AbstractClientSideNodeManager.RootNode<TData>,
        {
            step,
            columnsChanged = false,
            animate = false,
            keepRenderedRows = false,
            keepUndoRedoStack = false,
            rowsOrderChanged = false,
        }: RefreshModelParams<TData>,

        /**
         * The ChangedPath containing the changed parent nodes in DFS order.
         * By default is disabled, and it gets enabled only if running an immutable set data.
         */
        public readonly changedPath: ChangedPath = createInactiveChangedPath(rootNode)
    ) {
        this.step = step;
        this.columnsChanged = columnsChanged;
        this.animate = animate;
        this.keepRenderedRows = keepRenderedRows;
        this.keepUndoRedoStack = keepUndoRedoStack;
        this.rowsOrderChanged = rowsOrderChanged;
    }

    public updateParams({
        step,
        columnsChanged = false,
        animate = false,
        keepRenderedRows = false,
        keepUndoRedoStack = false,
        rowsOrderChanged = false,
    }: RefreshModelParams<any>) {
        this.columnsChanged ||= columnsChanged;
        this.animate &&= animate;
        this.keepRenderedRows &&= keepRenderedRows;
        this.keepUndoRedoStack &&= keepUndoRedoStack;
        if (rowsOrderChanged && !this.newData) {
            this.rowsOrderChanged = true;
        }
        this.setStep(step);
    }

    /**
     * Steps have an order. This method updates the step if the new step is before the current step.
     * Precedence must be respected, for example, group comes before 'filter', so if the new step is 'filter',
     * we don't update the step if the current step is 'group'.
     */
    public setStep(step: ClientSideRowModelStage): void {
        if (orderedSteps[step] < orderedSteps[this.step]) {
            this.step = step;
        }
    }

    public setStepFromStages(
        orderedStages: IRowNodeStageDefinition[],
        changedProps: (keyof GridOptions<TData>)[]
    ): void {
        if (this.step === 'group') {
            return; // Is already the minimum
        }
        const changedPropsLen = changedProps.length;
        for (const { refreshProps, step } of orderedStages) {
            for (let i = 0; i < changedPropsLen; i++) {
                if (refreshProps.has(changedProps[i])) {
                    this.setStep(step);
                    return; // We found the minimum step
                }
            }
        }
    }

    public setNewData(): void {
        this.setStep('group');
        this.rowDataUpdated = true;
        this.newData = true;
        this.columnsChanged = false;
        this.animate = false;
        this.keepRenderedRows = false;
        this.keepUndoRedoStack = false;
        this.rowsOrderChanged = false;
        this.removals.clear();
        this.updates.clear();
        this.clearDeltaUpdate();
    }

    public setDeltaUpdate(): boolean {
        this.setStep('group');
        this.rowDataUpdated = true;
        this.keepUndoRedoStack = false;
        if (this.deltaUpdate) {
            return true;
        }
        if (this.newData || this.fullReload || !this.started) {
            return false;
        }
        this.deltaUpdate = true;
        this.changedPath.active = true;
        this.keepRenderedRows = true;
        this.animate = !this.gos.get('suppressAnimationFrame');
        return true;
    }

    public clearDeltaUpdate(): void {
        this.deltaUpdate = false;
        this.changedPath.active = false;
        this.deltaUpdateTransactions = null;
    }

    /** Registers a node as removed. It has precedence over add and update. */
    public remove(node: IRowNode<TData>): void {
        this.removals.add(node as RowNode<TData>);
        this.updates.delete(node as RowNode<TData>);
    }

    /** Registers a node as updated. Note that add has the precedence. */
    public update(node: IRowNode<TData>): boolean {
        const updates = this.updates;
        if (updates.has(node as RowNode<TData>)) {
            return false;
        }
        updates.set(node as RowNode<TData>, false);
        return true;
    }

    /** Registers a node as added. Add has the precedence over update. */
    public add(node: IRowNode<TData>): void {
        this.updates.set(node as RowNode<TData>, true);
    }

    public hasChanges(): boolean {
        return this.newData || this.rowsOrderChanged || this.removals.size > 0 || this.updates.size > 0;
    }
}
