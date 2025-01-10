import type { AgColumn, ColumnEventType, IGroupFilterService, NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class GroupFilterService extends BeanStub implements NamedBean, IGroupFilterService {
    readonly beanName = 'groupFilter' as const;

    public postConstruct(): void {
        this.addManagedEventListeners({
            columnRowGroupChanged: () => this.updateFilterFlags('columnRowGroupChanged'),
        });
    }

    public isGroupFilter(column: AgColumn): boolean {
        return column.getColDef().filter === 'agGroupColumnFilter';
    }

    public isFilterAllowed(column: AgColumn): boolean {
        const colFilter = this.beans.colFilter;
        return !!this.getSourceColumns(column)?.some((column) => colFilter?.isFilterAllowed(column));
    }

    public isFilterActive(column: AgColumn): boolean {
        const colFilter = this.beans.colFilter;
        return !!this.getSourceColumns(column)?.some((column) => colFilter?.isFilterActive(column));
    }

    public getSourceColumns(column: AgColumn): AgColumn[] | null | undefined {
        return this.beans.showRowGroupCols?.getSourceColumnsForGroupColumn(column);
    }

    public updateFilterFlags(source: ColumnEventType, additionalEventAttributes?: any): void {
        const { autoColSvc, colFilter } = this.beans;
        autoColSvc?.getAutoCols()?.forEach((groupColumn) => {
            if (this.isGroupFilter(groupColumn)) {
                colFilter?.setColFilterActive(
                    groupColumn,
                    this.isFilterActive(groupColumn),
                    source,
                    additionalEventAttributes
                );
            }
        });
    }
}
