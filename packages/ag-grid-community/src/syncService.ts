import { _convertColumnEventSourceType } from './columns/columnUtils';
import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { ColDef, ColGroupDef } from './entities/colDef';
import type { PropertyValueChangedEvent } from './gridOptionsService';
import { _logIfDebug } from './utils/function';

export class SyncService extends BeanStub implements NamedBean {
    beanName = 'syncSvc' as const;

    private waitingForColumns: boolean = false;

    public postConstruct(): void {
        this.addManagedPropertyListener('columnDefs', (event) => this.setColumnDefs(event));
    }

    public start(): void {
        // we wait until the UI has finished initialising before setting in columns and rows
        this.beans.ctrlsSvc.whenReady(this, () => {
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
        const { colModel, rowModel } = this.beans;
        colModel.setColumnDefs(columnDefs ?? [], 'gridInitializing');
        rowModel.start();
    }

    private gridReady(): void {
        const { eventSvc, gos } = this;
        eventSvc.dispatchEvent({
            type: 'gridReady',
        });
        _logIfDebug(gos, `initialised successfully, enterprise = ${gos.isModuleRegistered('EnterpriseCore')}`);
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

        this.beans.colModel.setColumnDefs(columnDefs, _convertColumnEventSourceType(event.source));
    }
}
