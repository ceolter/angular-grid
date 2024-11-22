#!/bin/bash

set -eu

if [[ $(uname) == "Darwin" ]] ; then
    find ./packages/**/src -name \*.ts | xargs sed -e "s/'ag-charts-types\/scene'/'ag-charts-community\/scene'/" -i ''
else
    find ./packages/**/src -name \*.ts | xargs sed -e "s/'ag-charts-types\/scene'/'ag-charts-community\/scene'/" -i''
fi

git apply <<EOF
diff --git a/packages/ag-grid-enterprise/src/charts/agChartsExports.ts b/packages/ag-grid-enterprise/src/charts/agChartsExports.ts
index 923c41bbaa..c35e75565e 100644
--- a/packages/ag-grid-enterprise/src/charts/agChartsExports.ts
+++ b/packages/ag-grid-enterprise/src/charts/agChartsExports.ts
@@ -1,8 +1,9 @@
-import type { IntegratedModule } from 'ag-charts-types';
+import type { AgChartsCommunityModule, IntegratedModule } from 'ag-charts-community';
 
 import type { NamedBean } from 'ag-grid-community';
 import { BeanStub } from 'ag-grid-community';
-type ChartTypes = IntegratedModule;
+
+type ChartTypes = typeof AgChartsCommunityModule;
 
 /** Bean to expose the AG Charts apis from a single location and not require a code dependency on ag-charts-community */
 export class AgChartsExports extends BeanStub implements NamedBean {
EOF
