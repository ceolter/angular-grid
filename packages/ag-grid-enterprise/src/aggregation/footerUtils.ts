import type { BeanCollection } from 'ag-grid-community';
import { RowNode } from 'ag-grid-community';

/**
 * When creating sibling nodes (e.g. footers), we don't copy these properties as they
 * cause the sibling to have properties which should be unique to the row.
 *
 * Note that `keyof T` does not include private members of `T`, so these need to be
 * added explicitly to this list. Take care when adding or renaming private properties
 * of `RowNode`.
 */
const IGNORED_SIBLING_PROPERTIES = new Set<
    keyof RowNode | '__localEventService' | '__autoHeights' | '__checkAutoHeightsDebounced'
>(['__localEventService', '__objectId', 'sticky', '__autoHeights', '__checkAutoHeightsDebounced']);

export function _createRowNodeFooter(rowNode: RowNode, beans: BeanCollection): void {
    // only create footer node once, otherwise we have daemons and
    // the animate screws up with the daemons hanging around
    if (rowNode.sibling) {
        return;
    }

    const footerNode = new RowNode(beans);

    Object.keys(rowNode).forEach((key: keyof RowNode) => {
        if (IGNORED_SIBLING_PROPERTIES.has(key)) {
            return;
        }
        (footerNode as any)[key] = (rowNode as any)[key];
    });

    footerNode.footer = true;
    footerNode.setRowTop(null);
    footerNode.setRowIndex(null);

    // manually set oldRowTop to null so we discard any
    // previous information about its position.
    footerNode.oldRowTop = null;

    footerNode.id = 'rowGroupFooter_' + rowNode.id;

    // get both header and footer to reference each other as siblings. this is never undone,
    // only overwritten. so if a group is expanded, then contracted, it will have a ghost
    // sibling - but that's fine, as we can ignore this if the header is contracted.
    footerNode.sibling = rowNode;
    rowNode.sibling = footerNode;
}

export function _destroyRowNodeFooter(rowNode: RowNode): void {
    if (!rowNode.sibling) {
        return;
    }

    rowNode.sibling.setRowTop(null);
    rowNode.sibling.setRowIndex(null);

    rowNode.sibling = undefined as any;
}
