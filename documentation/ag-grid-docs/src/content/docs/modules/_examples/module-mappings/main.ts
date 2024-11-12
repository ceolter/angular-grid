import { ClientSideRowModelModule, RowSelectionModule } from 'ag-grid-community';
import type {
    GetRowIdParams,
    GridApi,
    GridOptions,
    IRowNode,
    Module,
    RowSelectedEvent,
    ValueFormatterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, ClipboardModule, ContextMenuModule, TreeDataModule } from 'ag-grid-enterprise';

import { modules } from './modules';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    TreeDataModule,
    RowSelectionModule,
    ContextMenuModule,
    ClipboardModule,
]);

let gridApi: GridApi;

const dependencies: Map<string, Set<string>> = new Map();

const calcDependencies = ({ moduleName, dependsOn }: Module) => {
    let moduleDependencies = dependencies.get(moduleName);
    if (!moduleDependencies) {
        moduleDependencies = new Set();
        dependencies.set(moduleName, moduleDependencies);
        dependsOn?.forEach((child) => {
            moduleDependencies!.add(child.moduleName);
            const childDependencies = calcDependencies(child);
            childDependencies.forEach((childDependency) => moduleDependencies!.add(childDependency));
        });
    }
    return moduleDependencies;
};

AllEnterpriseModule.dependsOn?.forEach(calcDependencies);

const gridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
    },
    columnDefs: [{ field: 'moduleName' }],
    autoGroupColumnDef: {
        headerName: 'Feature',
        valueFormatter: (params: ValueFormatterParams) => `${params.value}${params.data.isEnterprise ? ' (e)' : ''}`,
    },
    rowData: modules.groups,
    treeData: true,
    treeDataChildrenField: 'children',
    getRowId: (params: GetRowIdParams) => params.data.name,
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
    },
    onRowSelected: (event: RowSelectedEvent) => {
        const {
            node,
            data: { moduleName },
            api,
        } = event;
        if (node.isSelected()) {
            const moduleDependencies = dependencies.get(moduleName);
            if (moduleDependencies) {
                const selectedNodes: IRowNode[] = [];
                api.forEachLeafNode((node) => {
                    if (moduleDependencies.has(node.data.moduleName)) {
                        selectedNodes.push(node);
                    }
                });
                if (selectedNodes.length) {
                    api.setNodesSelected({
                        nodes: selectedNodes,
                        newValue: true,
                    });
                }
            }
        }
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
