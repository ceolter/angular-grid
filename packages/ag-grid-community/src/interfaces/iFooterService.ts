import type { RowNode } from '../entities/rowNode';

export interface IFooterService {
    addTotalRows(
        startIndex: number,
        node: RowNode,
        callback: (node: RowNode, index: number) => void,
        includeFooterNodes: boolean,
        isRootNode: boolean,
        position: 'top' | 'bottom'
    ): number;

    getTopDisplayIndex(
        rowsToDisplay: RowNode[],
        topLevelIndex: number,
        childrenAfterSort: RowNode[],
        getDefaultIndex: (adjustedIndex: number) => number
    ): number;
}
