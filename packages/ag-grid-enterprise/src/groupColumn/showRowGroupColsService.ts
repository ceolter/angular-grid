import { BeanStub } from 'ag-grid-community';
import type {
    AgColumn,
    BeanCollection,
    ColumnModel,
    IColsService,
    IShowRowGroupColsService,
    NamedBean,
} from 'ag-grid-community';

export class ShowRowGroupColsService extends BeanStub implements NamedBean, IShowRowGroupColsService {
    beanName = 'showRowGroupCols' as const;

    private colModel: ColumnModel;
    private rowGroupColsSvc?: IColsService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.rowGroupColsSvc = beans.rowGroupColsSvc;
    }

    private showRowGroupCols: AgColumn[];
    private showRowGroupColsMap: { [originalColumnId: string]: AgColumn };

    public refresh(): void {
        this.showRowGroupCols = [];
        this.showRowGroupColsMap = {};

        this.colModel.getCols().forEach((col) => {
            const colDef = col.getColDef();
            const showRowGroup = colDef.showRowGroup;

            const isString = typeof showRowGroup === 'string';
            const isTrue = showRowGroup === true;

            if (!isString && !isTrue) {
                return;
            }

            this.showRowGroupCols.push(col);

            if (isString) {
                this.showRowGroupColsMap[showRowGroup] = col;
            } else if (this.rowGroupColsSvc) {
                this.rowGroupColsSvc.columns.forEach((rowGroupCol) => {
                    this.showRowGroupColsMap[rowGroupCol.getId()] = col;
                });
            }
        });
    }

    public getShowRowGroupCols(): AgColumn[] {
        return this.showRowGroupCols;
    }

    public getShowRowGroupCol(id: string): AgColumn | undefined {
        return this.showRowGroupColsMap[id];
    }

    public getSourceColumnsForGroupColumn(groupCol: AgColumn): AgColumn[] | null {
        const sourceColumnId = groupCol.getColDef().showRowGroup;
        if (!sourceColumnId) {
            return null;
        }

        if (sourceColumnId === true && this.rowGroupColsSvc) {
            return this.rowGroupColsSvc?.columns.slice(0);
        }

        const column = this.colModel.getColDefCol(sourceColumnId as string);
        return column ? [column] : null;
    }
}
