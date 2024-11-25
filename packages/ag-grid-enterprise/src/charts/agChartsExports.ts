import type { IntegratedModule } from 'ag-charts-types';

import type { NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

type ChartTypes = IntegratedModule;

/** Bean to expose the AG Charts apis from a single location and not require a code dependency on ag-charts-community */
export class AgChartsExports extends BeanStub implements NamedBean {
    beanName = 'agChartsExports' as const;

    isEnterprise = false;
    create: ChartTypes['create'];
    _Theme: ChartTypes['_Theme'];
    _Scene: ChartTypes['_Scene'];
    _Util: ChartTypes['_Util'];

    constructor(params: IntegratedModule) {
        super();
        this.create = params.create as any;
        this._Theme = params._Theme as any;
        this._Scene = params._Scene as any;
        this.isEnterprise = params.isEnterprise as any;
        this._Util = params._Util as any;
    }
}
