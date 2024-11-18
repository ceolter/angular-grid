import type { CollectionEntry } from 'astro:content';
import { type FunctionComponent, useCallback, useEffect, useState } from 'react';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, RowSelectionModule } from 'ag-grid-community';
import type {
    GetRowIdParams,
    IRowNode,
    Module,
    RowSelectedEvent,
    RowSelectionOptions,
    ValueFormatterParams,
} from 'ag-grid-community';
import { AllEnterpriseModule, ClipboardModule, ContextMenuModule, TreeDataModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

interface Props {
    modules: CollectionEntry<'module-mappings'>['data'];
}

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    TreeDataModule,
    RowSelectionModule,
    ContextMenuModule,
    ClipboardModule,
]);

export const ModuleMappings: FunctionComponent<Props> = ({ modules }) => {
    const [dependencies] = useState(new Map<string, Set<string>>());
    const [defaultColDef] = useState({
        flex: 1,
    });
    const [columnDefs] = useState([{ field: 'moduleName' }]);
    const [autoGroupColumnDef] = useState({
        headerName: 'Feature',
        valueFormatter: (params: ValueFormatterParams) => `${params.value}${params.data.isEnterprise ? ' (e)' : ''}`,
    });
    const getRowId = useCallback((params: GetRowIdParams) => params.data.name, []);
    const onRowSelected = useCallback(
        (event: RowSelectedEvent) => {
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
        [dependencies]
    );
    const [treeData] = useState(true);
    const [treeDataChildrenField] = useState('children');
    const [rowSelection] = useState<RowSelectionOptions>({
        mode: 'multiRow',
        groupSelects: 'descendants',
    });
    const [groupDefaultExpanded] = useState(-1);
    const [loadThemeGoogleFonts] = useState(true);

    useEffect(() => {
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
    }, [dependencies]);

    return (
        <div style={{ height: '600px' }}>
            <AgGridReact
                defaultColDef={defaultColDef}
                columnDefs={columnDefs}
                autoGroupColumnDef={autoGroupColumnDef}
                rowData={modules.groups}
                treeData={treeData}
                treeDataChildrenField={treeDataChildrenField}
                getRowId={getRowId}
                rowSelection={rowSelection}
                onRowSelected={onRowSelected}
                groupDefaultExpanded={groupDefaultExpanded}
                loadThemeGoogleFonts={loadThemeGoogleFonts}
            />
        </div>
    );
};
