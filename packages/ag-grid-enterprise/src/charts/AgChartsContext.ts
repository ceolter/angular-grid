import type { IntegratedChartModule } from 'ag-charts-types';

import type { NamedBean } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class AgChartsContext extends BeanStub implements NamedBean {
    beanName = 'agChartsContext' as const;

    isEnterprise = false;
    create: IntegratedChartModule['create'];
    _Theme: IntegratedChartModule['_Theme'];
    _Scene: any; // types not exposed as only used for mini charts
    _Util: IntegratedChartModule['_Util'];

    constructor(params: IntegratedChartModule) {
        super();
        this.create = params.create;
        this._Theme = params._Theme;
        this._Scene = params._Scene;
        this.isEnterprise = params.isEnterprise;
        this._Util = params._Util;
    }
}
