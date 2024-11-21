import { BeanStub } from 'ag-grid-community';
import type { AgColumn, IShowRowGroupColsService, NamedBean } from 'ag-grid-community';

export class ShowRowGroupColsService extends BeanStub implements NamedBean, IShowRowGroupColsService {
    beanName = 'showRowGroupCols' as const;

    private showRowGroupCols: AgColumn[];
    private showRowGroupColsMap: { [originalColumnId: string]: AgColumn };

    public refresh(): void {
        this.showRowGroupCols = [];
        this.showRowGroupColsMap = {};

        const { colModel, rowGroupColsSvc } = this.beans;

        colModel.getCols().forEach((col) => {
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
            } else if (rowGroupColsSvc) {
                rowGroupColsSvc.columns.forEach((rowGroupCol) => {
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

        const { rowGroupColsSvc, colModel } = this.beans;
        if (sourceColumnId === true && rowGroupColsSvc) {
            return rowGroupColsSvc.columns.slice(0);
        }

        const column = colModel.getColDefCol(sourceColumnId as string);
        return column ? [column] : null;
    }

    public isRowGroupDisplayed(column: AgColumn, colId: string): boolean {
        const { colDef } = column;
        if (colDef?.showRowGroup == null) {
            return false;
        }

        const showingAllGroups = colDef.showRowGroup === true;
        const showingThisGroup = colDef.showRowGroup === colId;

        return showingAllGroups || showingThisGroup;
    }
}
