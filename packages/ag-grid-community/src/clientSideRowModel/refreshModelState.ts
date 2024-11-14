import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { GridOptionsService } from '../gridOptionsService';
import type { ClientSideRowModelStage } from '../interfaces/iClientSideRowModel';
import type { IRowNode } from '../interfaces/iRowNode';
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
    afterColumnsChanged?: boolean;

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
    changedPropsArray?: (keyof GridOptions<TData>)[];

    /** True if the row order changed */
    rowsOrderChanged?: boolean;

    /** A callback to execute to update row nodes, or execute transactions */
    updateRowNodes?: (state: RefreshModelState<TData>) => void;
}

export class RefreshModelState<TData = any> {
    public rowData: TData[] | null | undefined;

    /** If this is true, refreshModel was called inside refreshModel */
    public nested: boolean = false;

    /** The CSRM might still not be in a started state during initialization */
    public started: boolean = false;

    /** how much of the pipeline to execute */
    public step: ClientSideRowModelStage;

    /** The set of changed grid options, if any */
    public changedProps: Set<keyof GridOptions<TData>> | null = null;

    /** true if this update is due to columns changing, ie no rows were changed */
    public afterColumnsChanged: boolean;

    /** if true, rows that are kept are animated to the new position */
    public animate: boolean;

    /**
     * if NOT new data, then this flag tells grid to check if rows already
     * exist for the nodes (matching by node id) and reuses the row if it does.
     */
    public keepRenderedRows: boolean;

    /** true if all we did is changed row height, data still the same, no need to clear the undo/redo stacks */
    public keepUndoRedoStack: boolean;

    /** The ChangedPath containing the changed parent nodes in DFS order. */
    public readonly changedPath: ChangedPath;

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
            afterColumnsChanged = false,
            animate = false,
            keepRenderedRows = false,
            keepUndoRedoStack = false,
            rowsOrderChanged = false,
            changedPropsArray,
        }: RefreshModelParams<TData>
    ) {
        const changedPath = new ChangedPath(false, rootNode);
        changedPath.active = false;
        this.changedPath = changedPath;

        this.step = step;
        this.rowData = gos.get('rowData');
        this.afterColumnsChanged = afterColumnsChanged;
        this.animate = animate;
        this.keepRenderedRows = keepRenderedRows;
        this.keepUndoRedoStack = keepUndoRedoStack;
        this.rowsOrderChanged = rowsOrderChanged;
        if (changedPropsArray) {
            this.addChangedProps(changedPropsArray);
        }
    }

    /**
     * We must handle the case a refreshModel is called inside another refreshModel.
     * And we want the result to be consistent.
     * This method will be called if a refresh state is already active in CSRM and we are starting
     * a new nested refresh state.
     * In this case, we have to smartly merge the new state with the existing one.
     * @param param0
     */
    public nest({
        step,
        afterColumnsChanged = false,
        animate = false,
        keepRenderedRows = false,
        keepUndoRedoStack = false,
        rowsOrderChanged = false,
        changedPropsArray,
    }: RefreshModelParams<any>) {
        this.nested = true;
        this.afterColumnsChanged ||= afterColumnsChanged;
        this.animate &&= animate;
        this.keepRenderedRows &&= keepRenderedRows;
        this.keepUndoRedoStack &&= keepUndoRedoStack;
        if (rowsOrderChanged && !this.newData) {
            this.rowsOrderChanged = true;
        }
        if (changedPropsArray) {
            this.addChangedProps(changedPropsArray);
        }
        this.updateStep(step);

        const newRowData = this.gos.get('rowData');
        if (newRowData !== this.rowData) {
            // We do this so we can handle the case where the user calls setRowData() inside a refresh model
            this.rowData = newRowData;
            (this.changedProps ??= new Set()).add('rowData');
        }
    }

    /**
     * Steps have an order. This method updates the step if the new step is before the current step.
     * Precedence must be respected, for example, group comes before 'filter', so if the new step is 'filter',
     * we don't update the step if the current step is 'group'.
     */
    public updateStep(step: ClientSideRowModelStage): void {
        if (orderedSteps[step] < orderedSteps[this.step]) {
            this.step = step;
        }
    }

    public setNewData(): void {
        this.rowDataUpdated = true;
        this.newData = true;
        this.deltaUpdate = false;
        this.afterColumnsChanged = false;
        this.animate = false;
        this.keepRenderedRows = false;
        this.keepUndoRedoStack = false;
        this.rowsOrderChanged = false;
        this.deltaUpdateTransactions = null;
        this.removals.clear();
        this.updates.clear();
        this.changedPath.active = false;
        this.updateStep('group');
    }

    public setDeltaUpdate(): boolean {
        if (this.deltaUpdate) {
            return true;
        }
        if (this.newData || !this.started) {
            return false;
        }
        this.rowDataUpdated = true;
        this.deltaUpdate = true;
        this.changedPath.active = true;
        if (!this.nested) {
            this.keepRenderedRows = true;
            this.animate = !this.gos.get('suppressAnimationFrame');
        }
        this.updateStep('group');
        return true;
    }

    public remove(node: IRowNode<TData>): void {
        this.removals.add(node as RowNode<TData>);
        this.updates.delete(node as RowNode<TData>);
    }

    public update(node: IRowNode<TData>): boolean {
        const updates = this.updates;
        if (updates.has(node as RowNode<TData>)) {
            return false;
        }
        updates.set(node as RowNode<TData>, false);
        return true;
    }

    public add(node: IRowNode<TData>): void {
        this.updates.set(node as RowNode<TData>, true);
    }

    public hasChanges(): boolean {
        return this.newData || this.rowsOrderChanged || this.removals.size > 0 || this.updates.size > 0;
    }

    private addChangedProps(changedPropsArray: (keyof GridOptions<TData>)[]): void {
        const changedPropsArrayLen = changedPropsArray.length;
        if (changedPropsArrayLen > 0) {
            const changedProps = (this.changedProps ??= new Set());
            for (let i = 0; i < changedPropsArrayLen; i++) {
                changedProps.add(changedPropsArray[i]);
            }
        }
    }
}
