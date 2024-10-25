import type {
    BeanCollection,
    ColumnModel,
    RowCtrl,
    RowGroupOpenedEvent,
    RowNode,
    RowRenderer,
} from 'ag-grid-community';
import { BeanStub, _createGlobalRowEvent, _setAriaExpanded } from 'ag-grid-community';

export abstract class BaseExpansionService extends BeanStub {
    private rowRenderer: RowRenderer;
    protected colModel: ColumnModel;

    protected abstract dispatchExpandedEvent(event: RowGroupOpenedEvent, forceSync?: boolean): void;

    public wireBeans(beans: BeanCollection): void {
        this.rowRenderer = beans.rowRenderer;
        this.colModel = beans.colModel;
    }

    public addExpandedCss(classes: string[], rowNode: RowNode): void {
        if (rowNode.isExpandable()) {
            classes.push('ag-row-group');
            classes.push(rowNode.expanded ? 'ag-row-group-expanded' : 'ag-row-group-contracted');
        }
    }

    public getRowExpandedListeners(rowCtrl: RowCtrl): {
        expandedChanged: () => void;
        hasChildrenChanged: () => void;
    } {
        const rowNode = rowCtrl.getRowNode();
        const updateExpandedCss = this.updateExpandedCss.bind(this, rowCtrl, rowNode);
        return {
            expandedChanged: updateExpandedCss,
            hasChildrenChanged: updateExpandedCss,
        };
    }

    public setExpanded(rowNode: RowNode, expanded: boolean, e?: MouseEvent | KeyboardEvent, forceSync?: boolean): void {
        if (rowNode.expanded === expanded) {
            return;
        }

        rowNode.expanded = expanded;

        rowNode.dispatchRowEvent('expandedChanged');

        const event = { ..._createGlobalRowEvent(rowNode, this.gos, 'rowGroupOpened'), expanded, event: e || null };

        this.dispatchExpandedEvent(event, forceSync);

        // when using footers we need to refresh the group row, as the aggregation
        // values jump between group and footer, because the footer can be callback
        // we refresh regardless as the output of the callback could be a moving target
        this.rowRenderer.refreshCells({ rowNodes: [rowNode] });
    }

    public isExpandable(rowNode: RowNode): boolean {
        if (rowNode.footer) {
            return false;
        }

        if (this.colModel.isPivotMode()) {
            // master detail and leaf groups aren't expandable in pivot mode.
            return rowNode.hasChildren() && !rowNode.leafGroup;
        }
        return rowNode.hasChildren() || rowNode.master;
    }

    private updateExpandedCss(rowCtrl: RowCtrl, rowNode: RowNode): void {
        const expandable = rowNode.isExpandable();
        const expanded = rowNode.expanded == true;

        rowCtrl.forEachGui(undefined, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-group', expandable);
            gui.rowComp.addOrRemoveCssClass('ag-row-group-expanded', expandable && expanded);
            gui.rowComp.addOrRemoveCssClass('ag-row-group-contracted', expandable && !expanded);
            _setAriaExpanded(gui.element, expandable && expanded);
        });
    }
}
