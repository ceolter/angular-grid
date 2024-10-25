import type { IRowChildrenService, NamedBean, RowNode } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

/** handles row grouping and tree data logic */
export class SsrmRowChildrenService extends BeanStub implements NamedBean, IRowChildrenService {
    beanName = 'rowChildrenSvc' as const;

    public getHasChildrenValue(rowNode: RowNode): boolean | null {
        const isTreeData = this.gos.get('treeData');
        const isGroupFunc = this.gos.get('isServerSideGroup');
        // stubs and footers can never have children, as they're grid rows. if tree data the presence of children
        // is determined by the isServerSideGroup callback, if not tree data then the rows group property will be set.
        return (
            !rowNode.stub &&
            !rowNode.footer &&
            (isTreeData ? !!isGroupFunc && isGroupFunc(rowNode.data) : !!rowNode.group)
        );
    }
}
