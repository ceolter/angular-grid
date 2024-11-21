import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { RowNode } from '../entities/rowNode';

export class ValueCache extends BeanStub implements NamedBean {
    beanName = 'valueCache' as const;

    private cacheVersion = 0;
    private active: boolean;
    private neverExpires: boolean;

    public postConstruct(): void {
        const gos = this.gos;
        this.active = gos.get('valueCache');
        this.neverExpires = gos.get('valueCacheNeverExpires');
    }

    public onDataChanged(): void {
        if (this.neverExpires) {
            return;
        }

        this.expire();
    }

    public expire(): void {
        this.cacheVersion++;
    }

    public setValue(rowNode: RowNode, colId: string, value: any): any {
        if (this.active) {
            const cacheVersion = this.cacheVersion;
            if (rowNode.__cacheVersion !== cacheVersion) {
                rowNode.__cacheVersion = cacheVersion;
                rowNode.__cacheData = {};
            }

            rowNode.__cacheData[colId] = value;
        }
    }

    public getValue(rowNode: RowNode, colId: string): any {
        if (!this.active || rowNode.__cacheVersion !== this.cacheVersion) {
            return undefined;
        }

        return rowNode.__cacheData[colId];
    }
}
