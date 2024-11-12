import type { ChangedRowNodes } from '../clientSideRowModel/changedRowNodes';
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

    setNewRowData(changedRowNodes: ChangedRowNodes<TData>, rowData: TData[]): void;

    setImmutableRowData(changedRowNodes: ChangedRowNodes<TData>, rowData: TData[]): boolean;

    applyTransaction(
        changedRowNodes: IChangedRowNodes<TData>,
        rowDataTran: RowDataTransaction<TData>
    ): RowNodeTransaction<TData>;

    refreshModel(params: RefreshModelParams<TData>): void;
}
