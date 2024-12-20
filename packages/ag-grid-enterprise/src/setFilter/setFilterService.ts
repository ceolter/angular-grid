import type { NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

import type { SetFilterHelperParams } from './setFilterHelper';
import { SetFilterHelper } from './setFilterHelper';

export class SetFilterService extends BeanStub implements NamedBean {
    beanName = 'setFilterSvc' as const;

    private readonly helpers: Map<string, SetFilterHelper<any>> = new Map();

    public getHelper<TValue>(params: SetFilterHelperParams<TValue>): SetFilterHelper<TValue> {
        const helpers = this.helpers;
        const colId = params.column.getColId();
        const helper = helpers.get(colId);
        if (helper) {
            return helper as SetFilterHelper<TValue>;
        }
        const newHelper = this.createBean(new SetFilterHelper()) as SetFilterHelper<TValue>;
        newHelper.init(params);
        helpers.set(colId, newHelper);
        return newHelper;
    }

    public removeHelper(colId: string): void {
        const helpers = this.helpers;
        const helper = helpers.get(colId);
        this.destroyBean(helper);
        if (helper) {
            helpers.delete(colId);
        }
    }

    public override destroy(): void {
        const helpers = this.helpers;
        helpers.forEach((helper) => this.destroyBean(helper));
        helpers.clear();
    }
}
