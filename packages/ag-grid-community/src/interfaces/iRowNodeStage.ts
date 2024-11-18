import type { RefreshModelState } from '../clientSideRowModel/refreshModelState';
import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { ChangedPath } from '../utils/changedPath';
import type { ClientSideRowModelStage } from './iClientSideRowModel';

export interface IRowNodeStageDefinition {
    step: ClientSideRowModelStage;
    refreshProps: Set<keyof GridOptions>;
}

export interface IRowNodeStage<TData = any> extends IRowNodeStageDefinition {
    execute(params: RefreshModelState<TData>): void;
}

export interface IRowNodeAggregationStage extends IRowNodeStageDefinition {
    aggregate(changedPath: ChangedPath): void;
}

export interface IRowNodeMapStage<TData = any> extends IRowNodeStage<TData> {
    execute(params: RefreshModelState<TData>): RowNode<TData>[];
}
