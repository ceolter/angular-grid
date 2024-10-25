import type { ColumnModel } from './columns/columnModel';
import { _convertColumnEventSourceType } from './columns/columnUtils';
import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { CtrlsService } from './ctrlsService';
import type { ColDef, ColGroupDef } from './entities/colDef';
import type { PropertyValueChangedEvent } from './gridOptionsService';
import type { IRowModel } from './interfaces/iRowModel';
import { _logIfDebug } from './utils/function';

export class SyncService extends BeanStub implements NamedBean {
    beanName = 'syncSvc' as const;

    private ctrlsSvc: CtrlsService;
    private colModel: ColumnModel;
    private rowModel: IRowModel;

    public wireBeans(beans: BeanCollection) {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colModel = beans.colModel;
        this.rowModel = beans.rowModel;
    }

    private waitingForColumns: boolean = false;

    public postConstruct(): void {
        this.addManagedPropertyListener('columnDefs', (event) => this.setColumnDefs(event));
    }

    public start(): void {
        // we wait until the UI has finished initialising before setting in columns and rows
        this.ctrlsSvc.whenReady(this, () => {
            const columnDefs = this.gos.get('columnDefs');
            if (columnDefs) {
                this.setColumnsAndData(columnDefs);
            } else {
                this.waitingForColumns = true;
            }
            this.gridReady();
        });
    }

    private setColumnsAndData(columnDefs: (ColDef | ColGroupDef)[]): void {
        this.colModel.setColumnDefs(columnDefs ?? [], 'gridInitializing');
        this.rowModel.start();
    }

    private gridReady(): void {
        this.eventSvc.dispatchEvent({
            type: 'gridReady',
        });
        _logIfDebug(
            this.gos,
            `initialised successfully, enterprise = ${this.gos.isModuleRegistered('EnterpriseCoreModule')}`
        );
    }

    private setColumnDefs(event: PropertyValueChangedEvent<'columnDefs'>): void {
        const columnDefs = this.gos.get('columnDefs');
        if (!columnDefs) {
            return;
        }

        if (this.waitingForColumns) {
            this.waitingForColumns = false;
            this.setColumnsAndData(columnDefs);
            return;
        }

        this.colModel.setColumnDefs(columnDefs, _convertColumnEventSourceType(event.source));
    }
}
