import type { CollectionEntry } from 'astro:content';
import { type FunctionComponent, useEffect, useState } from 'react';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, RowSelectionModule } from 'ag-grid-community';
import type { GetRowIdParams, IRowNode, Module, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';
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
                defaultColDef={{
                    flex: 1,
                }}
                columnDefs={[{ field: 'moduleName' }]}
                autoGroupColumnDef={{
                    headerName: 'Feature',
                    valueFormatter: (params: ValueFormatterParams) =>
                        `${params.value}${params.data.isEnterprise ? ' (e)' : ''}`,
                }}
                rowData={modules.groups}
                treeData={true}
                treeDataChildrenField="children"
                getRowId={(params: GetRowIdParams) => params.data.name}
                rowSelection={{
                    mode: 'multiRow',
                    groupSelects: 'descendants',
                }}
                onRowSelected={(event: RowSelectedEvent) => {
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
                }}
                groupDefaultExpanded={-1}
                loadThemeGoogleFonts={true}
            />
        </div>
    );
};
