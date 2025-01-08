import type { NamedBean, RowNode } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import type { DataFieldGetter } from './fieldAccess';
import { makeFieldPathGetter } from './fieldAccess';

export class ClientSideParentIdTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements NamedBean
{
    beanName = 'csrmParentIdTreeNodeSvc' as const;

    private parentIdGetter: DataFieldGetter<TData, string | null | undefined> | null = null;

    public override get treeData(): boolean {
        return this.gos.get('treeData');
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.parentIdGetter = null;
    }

    public override activate(rootNode: RowNode<TData>): void {
        const oldChildrenGetter = this.parentIdGetter;
        const childrenField = this.gos.get('treeDataChildrenField' as any);
        if (!oldChildrenGetter || oldChildrenGetter.path !== childrenField) {
            this.parentIdGetter = makeFieldPathGetter(childrenField);
        }

        super.activate(rootNode);
    }

    protected override loadNewRowData(rowData: TData[]): void {
        const rootNode = this.rootNode!;
        const treeRoot = this.treeRoot!;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        super.loadNewRowData(rowData);

        this.treeCommit();
    }
}
