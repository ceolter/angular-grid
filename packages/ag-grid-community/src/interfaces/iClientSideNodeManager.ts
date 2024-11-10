import type { RowNode } from '../entities/rowNode';
import type { IChangedRowNodes, RefreshModelParams } from './iClientSideRowModel';
import type { RowDataTransaction } from './rowDataTransaction';
import type { RowNodeTransaction } from './rowNodeTransaction';

export type RowDataChildrenGetter<TData = any> = (data: TData | null | undefined) => TData[] | null | undefined;

export interface IClientSideNodeManager<TData = any> {
    readonly treeData: boolean;

    activate(rootNode: RowNode<TData> | null): void;

    deactivate(): void;

    getRowNode(id: string): RowNode<TData> | undefined;

    extractRowData(): (TData | undefined)[] | null | undefined;

    setNewRowData(rowData: TData[]): void;

    setImmutableRowData(changedRowNodes: IChangedRowNodes<TData>, rowData: TData[]): boolean;

    updateRowData(
        rowDataTran: RowDataTransaction<TData>,
        changedRowNodes: IChangedRowNodes<TData>
    ): RowNodeTransaction<TData>;

    refreshModel?(params: RefreshModelParams<TData>): void;
}
