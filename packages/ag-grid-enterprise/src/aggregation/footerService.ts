import type { IFooterService, NamedBean, RowNode } from 'ag-grid-community';
import { BeanStub, _getGrandTotalRow, _getGroupTotalRowCallback } from 'ag-grid-community';

import { _createRowNodeFooter } from './footerUtils';

export class FooterService extends BeanStub implements NamedBean, IFooterService {
    beanName = 'footerSvc' as const;

    public addNodes(
        params: {
            index: number;
        },
        nodes: RowNode[],
        callback: (node: RowNode, index: number) => void,
        includeFooterNodes: boolean,
        rootNode: RowNode | null,
        position: 'top' | 'bottom'
    ): void {
        const parentNode = nodes[0]?.parent;

        if (!parentNode) return;

        let { index } = params;

        const grandTotal = includeFooterNodes && _getGrandTotalRow(this.gos);
        const isGroupIncludeFooter = _getGroupTotalRowCallback(this.gos);
        const groupTotal = includeFooterNodes && isGroupIncludeFooter({ node: parentNode });

        const isRootNode = parentNode === rootNode;
        if (isRootNode) {
            if (grandTotal === position) {
                _createRowNodeFooter(parentNode, this.beans);
                callback(parentNode.sibling, index++);
            }
            return;
        }

        if (groupTotal === position) {
            _createRowNodeFooter(parentNode, this.beans);
            callback(parentNode.sibling, index++);
        }
    }

    public getTopDisplayIndex(
        rowsToDisplay: RowNode[],
        topLevelIndex: number,
        childrenAfterSort: RowNode[],
        getDefaultIndex: (adjustedIndex: number) => number
    ): number {
        let adjustedIndex = topLevelIndex;
        if (rowsToDisplay[0].footer) {
            // if footer is first displayed row and looking for first row, return footer
            if (topLevelIndex === 0) {
                return 0;
            }

            // if first row is footer, offset index to check sorted rows by 1
            adjustedIndex -= 1;
        }

        const lastRow = rowsToDisplay[rowsToDisplay.length - 1];
        const indexOutsideGroupBounds = adjustedIndex >= childrenAfterSort.length;
        // if last row is footer, and attempting to retrieve row of too high index, return footer row index
        if (lastRow.footer && indexOutsideGroupBounds) {
            return lastRow.rowIndex!;
        }

        return getDefaultIndex(adjustedIndex);
    }
}
