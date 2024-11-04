import type { RowNode } from '../entities/rowNode';
import type { RefreshModelParams } from './iClientSideRowModel';
import type { RowDataTransaction } from './rowDataTransaction';
import type { RowNodeTransaction } from './rowNodeTransaction';

export type RowDataChildrenGetter<TData = any> = (data: TData | null | undefined) => TData[] | null | undefined;

/** Result of IClientSideNodeManager.updateRowData method */
export interface ClientSideNodeManagerUpdateRowDataResult<TData = any> {
    /** The RowNodeTransaction containing all the removals, updates and additions */
    rowNodeTransaction: RowNodeTransaction<TData>;

    /** True if at least one row was inserted (and not just appended) */
    rowsInserted: boolean;
}

export interface IClientSideNodeManager<TData = any> {
    readonly treeData: boolean;

    activate(rootNode: RowNode<TData> | null): void;

    deactivate(): void;

    getRowNode(id: string): RowNode<TData> | undefined;

    extractRowData(): (TData | undefined)[] | null | undefined;

    setNewRowData(rowData: TData[]): void;

    setImmutableRowData(params: RefreshModelParams<TData>, rowData: TData[]): void;

    updateRowData(rowDataTran: RowDataTransaction<TData>): ClientSideNodeManagerUpdateRowDataResult<TData>;

    refreshModel?(params: RefreshModelParams<TData>): void;
}
